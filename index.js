'use strict';

/*!
 * ss2vue3
 * https://github.com/SnakeskinTpl/ss2vue3
 *
 * Released under the MIT license
 * https://github.com/SnakeskinTpl/ss2vue3/blob/master/LICENSE
 */

const
	snakeskin = require('snakeskin'),
	sfc = require('@vue/compiler-sfc');

exports.adapter = function (txt, opt_params, opt_info) {
	return snakeskin.adapter(txt, {setParams, template}, opt_params, opt_info);
};

const
	renderFnRgxp = /(?<name>(ssrR|r)ender)\s*\((?<args>.*?)\)\s*{/,
	importDeclRgxp = /\bimport\s+{([^}]*)}\s+from\s+(['"])(.*?)\2/g,
	exportDeclRgxp = /\bexport\s+/g;

const hoistedElementsRgxp =
	/(_hoisted_\d+)\s*=\s*(_createElementVNode\.call\([\s\S]+?\))(?=\s*const |\s*function )/g;

const hoistedPropsRgxp =
	/(_hoisted_\d+)\s*=\s*(\{[\s\S]+?})(?=\s*const |\s*function )/g;

function template(id, fn, txt, p) {
	let
		{code} = sfc.compileTemplate({id, ...p, source: txt});

	const
		fnDecl = renderFnRgxp.exec(code).groups,
		vars = [];

	code = code
		.replace(renderFnRgxp, `${fnDecl.name}() {`)
		.replace(exportDeclRgxp, '')

		.replace(hoistedElementsRgxp, (_, id, decl) =>
			`${id} = _ctx.$renderEngine.r.resolveAttrs.call(_ctx, ${decl})\n`)

		.replace(hoistedPropsRgxp, (_, id, decl) =>
			`${id} = _ctx.$renderEngine.r.resolveAttrs.call(_ctx, {props: ${decl}}).props\n`)

		.replace(importDeclRgxp, (_, decl, q, lib) => {
			decl = decl.replace(/\sas\s/g, ': ');

			switch (lib) {
				case 'vue':
					decl.split(/\s*,\s*/).forEach((varDecl) => {
						const v = varDecl.split(/\s*:\s*/);
						vars.push((v[1] ?? v[0]).trim());
					});

					return `const {${decl}} = _ctx.$renderEngine.r;`;

				default:
					return `const {${decl}} = require('${lib}');`;
			}
		});

	if (vars.length > 0) {
		const renderMethodsRgxp = new RegExp(`\\b(${vars.join('|')})\\s*[(]`, 'g');
		code = code.replace(renderMethodsRgxp, (_, $1) => `${$1}.call(_ctx,`);
	}

	return `${id} = ${fn}return ${toFunction(fnDecl.name, fnDecl.args, `${code}; return ${fnDecl.name};`)}};`;
}

function setParams(p) {
	return {...p};
}

function toFunction(name, args, code) {
	return `function ${name}(${args}) {${code}}`;
}

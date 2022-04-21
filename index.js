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

function template(id, fn, txt, p) {
	let code = sfc.compileTemplate({
		id,
		source: txt,
		...p
	}).code;

	const
		vars = [];

	code = code
		.replace(/render\s*\(.*?\)\s*{/, 'render() {')

		.replace(/\bexport\s+/g, '')

		.replace(/\bimport\s+{([^}]*)}\s+from\s+(['"])vue\2/g, (_, decl) => {
			decl = decl.replace(/\sas\s/g, ': ');

			decl.split(/\s*,\s*/).forEach((varDecl) => {
				const v = varDecl.split(/\s*:\s*/);
				vars.push(v[1] ?? v[0]);
			});

			return `const {${decl}} = _ctx.$renderEngine.render;`;
		})

		.replace(new RegExp(`\\b(${vars.join('|')})[(](\\s*[)])?`, 'g'), (_, $1, $2) =>
			$2 ? `${$1}.call(_ctx)` : `${$1}.call(_ctx,`);

	return `${id} = ${fn}return ${toFunction(`${code}; return render;`)}};`;

	function toFunction(code) {
		return `function (_ctx, _cache) {${code}}`;
	}
}

function setParams(p) {
	return {...p};
}

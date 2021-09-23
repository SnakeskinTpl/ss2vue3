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

function toFunction(code) {
	return `function () {${code}}`;
}

function setParams(p) {
	return {...p};
}

const
	importRgxp = /\bimport\s+{([^}]*)}\s+from\s+(['"])vue\2/g,
	exportRgxp = /\bexport\s+/g,
	asRgxp = /\sas\s/g;

function template(id, fn, txt, p) {
	let code = sfc.compileTemplate({
		id,
		source: txt,
		...p
	}).code;

	code = code.replace(importRgxp, (_, vars) => `const {${vars.replace(asRgxp, ': ')}} = this;`);
	code = code.replace(exportRgxp, '');

	code = `{
		render: ${toFunction(`${code}; return render.call(this);`)}
	};`;

	return `${id} = ${fn}return ${code}};`;
}

exports.adapter = function (txt, opt_params, opt_info) {
	return snakeskin.adapter(txt, {setParams, template}, opt_params, opt_info);
};

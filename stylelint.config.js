module.exports = {
	extends: [
		'stylelint-config-standard',
		'stylelint-config-recommended-scss',
	],
	plugins: [
		'stylelint-order',
	],
	rules: {
		indentation: 4,
		'no-descending-specificity': null,
		'no-empty-source': null,
		'order/properties-alphabetical-order': true,
	},
};

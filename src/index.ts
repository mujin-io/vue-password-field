import {defineComponent, reactive, createVNode, watch, PropType} from 'vue';

interface PasswordDataInterface {
	isPlaintext: boolean;
	isShowTips: boolean;
	isIncludes: boolean
	password: string;
}

const rules =  {
	lower: /(.*[a-z].*)/,
	upper: /(.*[A-Z].*)/,
	numberic: /(.*\d.*)/,
	symbol: /[\x21-\x2F\x3A-\x3C\x3E-\x40\x5B\x5D-\x60\x7B\x7D-\x7E]/,
};

const icons: {
	failed: string,
	passed: string,
} = {
	failed: 'M35.314 8.444L24 19.757 12.686 8.444a1 1 0 0 0-1.414 0l-2.828 2.828a1 1 0 0 0 0 1.414L19.757 24 8.444 35.314a1 1 0 0 0 0 1.414l2.828 2.828a1 1 0 0 0 1.414 0L24 28.243l11.314 11.313a1 1 0 0 0 1.414 0l2.828-2.828a1 1 0 0 0 0-1.414L28.243 24l11.313-11.314a1 1 0 0 0 0-1.414l-2.828-2.828a1 1 0 0 0-1.414 0z',
	passed: 'M41.3 9.834L38.33 7.52a1 1 0 0 0-1.4.175l-17.697 22.73-8.613-8.614a1 1 0 0 0-1.414 0l-2.695 2.7a1 1 0 0 0 0 1.414l12.432 12.442a1 1 0 0 0 1.5-.093l21.034-27.037a1 1 0 0 0-.177-1.403z'
};

interface PasswordRequirementRuleInterface {
	key: string,
	message: string,
	rule: (args: string, callback?: Function) => {},
}

const requirementRules: PasswordRequirementRuleInterface[] = [
	{
		key: 'minimumCharacters',
		rule: (password: string): boolean => password.length >= 8,
		message: 'contains at least :len characters'
	},
	{
		key: 'containBothLowerUpper',
		rule: (password: string): boolean => [rules.lower, rules.upper].every(e => password.match(e)),
		message: 'contains both lower (a-z) and upper case letters (A-Z)'
	},
	{
		key: 'containNumberOrSymbol',
		rule: (password: string): boolean => [rules.numberic, rules.symbol].some(e => password.match(e)),
		message: `contains at least one number (0-9) or a symbol`
	},
	{
		key: 'containNumberAndSymbol',
		rule: (password: string): boolean => [rules.numberic, rules.symbol].every(e => password.match(e)),
		message: 'contains at least one number (0-9) and a symbol'
	},
	{
		key: 'notContainAccounts',
		rule: (password: string, callback): boolean => typeof callback === 'function' && callback(password.toLowerCase()),
		message: 'does not contain your account information'
	}
];

export default defineComponent({
	name: 'ofcold-password-field',
	props: {
		modelValue: { type: String, default: '' },
		requirements: {
			type: Array,
			default: ['containBothLowerUpper', 'minimumCharacters', 'containNumberOrSymbol', 'notContainAccounts'],
			validator: (v) => requirementRules.map(entry => entry.key).some(e => e === v)
		},
		minimumCharacters: { type: Number, default: 8},
		containAccounts: { type: Array, default: []},
		trans: { type: Function as PropType<() => string>, default: (k: string, locale?: string) => k}
	},
	emits: ['update:modelValue'],
	setup({modelValue, requirements, minimumCharacters, containAccounts, trans}, context) {
		const data = reactive<PasswordDataInterface>({
			isPlaintext: false,
			isShowTips: false,
			isIncludes: false,
			password: ''
		});

		watch((): string => data.password, (val: string, old: string): void => {
			if (val.length !== old.length) {
				setTimeout(() => {
					data.isIncludes = false;
				}, 2000);
			}
		});

		const messagesView = () => {
			let viewsList = requirementRules.filter(v => requirements.some((k:string) => k === v.key)).map(r => {
				let isPassed = r.key !== 'notContainAccounts' ? r.rule(data.password)
					: r.rule(data.password, (p: string) => {
						return p.length > 0 && ! containAccounts.filter((v): boolean => v !== undefined || v !== '' || v !== null)
							.map((v): string => v.toString().toLowerCase())
							.some((v: boolean) => p.includes(v));
					});
				return createVNode('li', {
					class: 'flex items-start ' + (isPassed ? 'text-green-600' : 'text-red-600'),
					'data-id': 'PasswordStrength-' + r.key
				}, [
					createVNode('span', {class: 'w-3 h-3 mt-1 mr-2'}, [
						createVNode('svg', {
							viewBox: '0 0 48 48',
							class: 'fill-current m-0',
						}, [
							createVNode('path', {
								d: isPassed ? icons.passed : icons.failed
							})
						])
					]),
					createVNode('span', {
						class: 'flex-1 min-w-0'
					}, trans(r.message.replace(':len', minimumCharacters)))
				]);
			});
			viewsList.push(createVNode('li', {class: 'flex items-start items-center text-gray-700', 'data-id': 'PasswordStrength-notContainAccounts'}, [
				createVNode('span', {class: 'flex h-2 w-2 relative mr-2', style: 'margin-left: 2px;'}, [
					createVNode('span', {class: (data.isIncludes ? 'animate-ping': '') +' absolute inline-flex h-full w-full rounded-full bg-gray-600 opacity-75'}),
					createVNode('span', {class: 'relative inline-flex rounded-full h-2 w-2 bg-gray-700'}),
				]),
				createVNode('span', {class: 'flex-1 min-w-0', style: 'margin-left: 2px;'}, trans('is not commonly used')),
			]));

			return viewsList;
		};

		return () => [
			createVNode('div',
				{
					class: 'relative'
				}, [
					createVNode('input', {
						type: data.isPlaintext ? 'text' : 'password',
						value: data.password,
						class: 'mt-1 block w-full py-2 pr-3 border-0 border-b border-gray-300 bg-white focus:outline-none focus:ring-indigo-500 focus:border-green-700',
						placeholder: '••••••••',
						onKeyup: (event: KeyboardEvent) => {},
						onInput: (event: InputEvent) => {
							data.isIncludes = true;
							data.password = (event.target as HTMLInputElement).value;
							context.emit('update:modelValue', data.password);
						}
					}),

					createVNode('button', {
						class: 'm-0 ml-3 absolute text-gray-700 inline-flex inset-y-0 right-0 flex items-center pr-2 cursor-pointer no-underline visible',
						type: 'button',
						onClick: (event: Event) => data.isPlaintext = !data.isPlaintext
					}, [
						createVNode('svg', {
							viewBox: '0 0 36 36',
							class: 'fill-current w-4',
						}, !data.isPlaintext ? [
							createVNode('path', {
								d: 'M24.613 8.58A14.972 14.972 0 0 0 18 6.937c-8.664 0-15.75 8.625-15.75 11.423 0 3 7.458 10.7 15.686 10.7 8.3 0 15.814-7.706 15.814-10.7 0-2.36-4.214-7.341-9.137-9.78zM18 27.225A9.225 9.225 0 1 1 27.225 18 9.225 9.225 0 0 1 18 27.225z',
							}),
							createVNode('path', {
								d: 'M20.667 18.083A2.667 2.667 0 0 1 18 15.417a2.632 2.632 0 0 1 1.35-2.27 4.939 4.939 0 0 0-1.35-.209A5.063 5.063 0 1 0 23.063 18a4.713 4.713 0 0 0-.175-1.2 2.625 2.625 0 0 1-2.221 1.283z'
							})
						] : [
							createVNode('path', {
								d: 'M14.573 9.44A9.215 9.215 0 0 1 26.56 21.427l2.945 2.945c2.595-2.189 4.245-4.612 4.245-6.012 0-2.364-4.214-7.341-9.137-9.78A14.972 14.972 0 0 0 18 6.937a14.36 14.36 0 0 0-4.989.941z'
							}),
							createVNode('path', {
								d: 'M33.794 32.058L22.328 20.592A5.022 5.022 0 0 0 23.062 18a4.712 4.712 0 0 0-.174-1.2 2.625 2.625 0 0 1-2.221 1.278A2.667 2.667 0 0 1 18 15.417a2.632 2.632 0 0 1 1.35-2.27 4.945 4.945 0 0 0-1.35-.209 5.022 5.022 0 0 0-2.592.734L3.942 2.206a.819.819 0 0 0-1.157 0l-.578.579a.817.817 0 0 0 0 1.157l6.346 6.346c-3.816 2.74-6.3 6.418-6.3 8.072 0 3 7.458 10.7 15.686 10.7a16.455 16.455 0 0 0 7.444-1.948l6.679 6.679a.817.817 0 0 0 1.157 0l.578-.578a.818.818 0 0 0-.003-1.155zM18 27.225a9.2 9.2 0 0 1-7.321-14.811l2.994 2.994A5.008 5.008 0 0 0 12.938 18 5.062 5.062 0 0 0 18 23.063a5.009 5.009 0 0 0 2.592-.736l2.994 2.994A9.144 9.144 0 0 1 18 27.225z'
							})
						])
					])
				]
			),

			createVNode('section', {
				class: 'pt-4 text-sm'
			}, [
				createVNode('strong', {class: 'text-gray-800'}, [trans('Create a password that:')]),
				createVNode('ul', {class: 'mt-2'}, messagesView())
			])
		]

	}
});

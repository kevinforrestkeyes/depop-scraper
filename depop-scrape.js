const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: true });


const start_url = 'https://www.depop.com/__pobrecita__';
const blurb_selector = '.css-1ski12 span span';

const getBlurb = async id => {
	console.log('getting product');
	const nightmare = new Nightmare({ show: true });
	let product_count = '';

	try {
		product_count = await nightmare
			.goto(start_url)
			.wait('[data-css-rabfxd]')
			.evaluate(() => {
				return [...document.querySelectorAll('[data-css-rabfxd]')].length;
			})
			.then();
	} catch(e) {
		console.log(e);
	}

	for(let i = 1; i <= product_count; i++) {
		try {
			const result = await nightmare
				.click('li:nth-child('+i+') [data-css-rabfxd]')
				.wait('.css-1ski12 span')
				.evaluate(() => {
					let blurb = [];
					let fields = [];
					if(document.querySelectorAll('.css-1ski12 span span').length > 0) {
						blurb = [...document.querySelectorAll('.css-1ski12 span span')]
							.map(el => el.innerText);
					} else {
						blurb = [...document.querySelectorAll('.css-1ski12 span')]
							.map(el => el.innerText);
					}
					fields = [...document.querySelectorAll('.css-un4s3n span')]
						.map(el => el.innerText);
					values = [...document.querySelectorAll('.css-syjz65')]
						.map(el => el.innerText);
					return {blurb: blurb.map(line => line.replace('\n','').trim()).filter(line => line !== ''),
							fields: fields,
							values: values}
				})
				.then();
			// let result_refined = result.map(line => line.replace('\n','').trim()).filter(line => line !== '');
			console.log(result);
		} catch(e) {
			console.log(e);
			i--;
		}

		try {
			await nightmare
				.goto(start_url)
				.wait('[data-css-rabfxd]')
				.then();
		} catch(e) {
			console.log(e);
		}
	}
};

getBlurb(12)
	.then(a => console.log(a))
	.catch(e => console.error(e));

// nightmare
// 	.goto(start_url)
// 	.click('.css-1hphgbj')
// 	.exists('[data-css-rabfxd]')
// 	.click('[data-css-rabfxd]')
// 	// .evaluate(() => document.querySelector('.css-1hphgbj'))
// 	// .evaluate(() => document.querySelector('.css-2ybrgo'))
// 	.wait('.css-1ski12 span span')
// 	// .select('.css-1ski12 span span')
// 	.evaluate(blurb_selector => {
// 		return document.querySelector(blurb_selector).innerText
// 	}, blurb_selector)
// 	.end()
// 	.then(console.log)
// 	.catch(error => {
// 		console.log(error)
// 	})
const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: false });
const fs = require('fs');

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

	let full_data = [];

	product_count = 2;

	for(let i = 1; i <= product_count; i++) {
		try {
			const result = await nightmare
				.click('li:nth-child('+i+') [data-css-rabfxd]')
				.wait('.css-iz6ix8 [data-css-gdcf1g] img')
				.evaluate(() => {
					let blurb = [];
					let fields = [];
					let values = [];
					let images = [];
					if(document.querySelectorAll('.css-1ski12 span span').length > 0) {
						blurb = [...document.querySelectorAll('.css-1ski12 span span')]
							.map(el => el.innerText);
					} else {
						blurb = [...document.querySelectorAll('.css-1ski12 span')]
							.map(el => el.innerText);
					}
					fields = [...document.querySelectorAll('.css-un4s3n span')]
						.map(el => el.innerText);
					values = [...document.querySelectorAll('.css-un4s3n.css-syjz65')]
						.map(el => el.innerText);
					images = [...document.querySelectorAll('.css-iz6ix8 [data-css-gdcf1g] img')]
						.map(el => el.src);
					return {blurb: blurb.map(line => line.replace('\n','').trim()).filter(line => line !== ''),
							fields: fields,
							values: values,
							images: images}
				})
				.then();
				full_data.push(result);
		} catch(e) {
			console.log(e);
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

	return JSON.stringify(full_data);
};

getBlurb(12)
	.then(a => {
		fs.writeFile("./scrape_data.json", a, function(err) {
			if(err) {
				return console.log(err);
			}

			console.log("file saved");
		});
	})
	.catch(e => console.error(e));






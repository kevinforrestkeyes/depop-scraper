'use strict';
const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: false, waitTimeout: 5000, executionTimeout: 1000 });
const fs = require('fs');
const vo = require('vo');

const username = process.argv[2];
const show_window = (process.argv[3] === 'true');
const blurb_selector = '.css-1ski12 span span';

const scrapeStore = async (username, show_window) => {
	console.log('now scraping from '+username+'s store');
	const start_url = "https://www.depop.com/"+username;
	const nightmare = new Nightmare({ show: show_window, waitTimeout: 5000, executionTimeout: 5000 });
	let product_count = '';

	try {
		await nightmare
			.goto(start_url)
			.wait('[data-css-rabfxd]');
	} catch(e) {
		console.log(e);
	}

	try {
		var previousHeight, currentHeight = 0;
		while(previousHeight !== currentHeight) {
			previousHeight = currentHeight;
			var currentHeight = await nightmare.evaluate(function() {
				return document.body.scrollHeight;
			});
			await nightmare.scrollTo(currentHeight, 0)
			.wait(1000);
		}
	} catch(e) {
		console.log(e);
	}

	try {
		product_count = await nightmare
		.evaluate(() => {
			return [...document.querySelectorAll('[data-css-rabfxd]')].length;
		})
		.then();
	} catch(e) {
		console.log(e);
	}

	console.log(product_count+' products to scrape');
	let full_data = [];

	for(let i = product_count; i > 0; i--) {
		console.log('scraping product '+(product_count-i+1)+'/'+product_count);
		if(i > 24) {
			try {
				let target_visible = false;
				var currentHeight = 0;
				while(!target_visible) {
					var currentHeight = await nightmare.evaluate(function() {
						return document.body.scrollHeight;
					})
					target_visible = await nightmare
						.exists('li:nth-child('+i+') [data-css-rabfxd]');
					await nightmare.scrollTo(currentHeight, 0)
					.wait(1000);
				}
			} catch(e) {
				console.log(e);
			}
		}

		let is_sold = false;

		try {
			is_sold = await nightmare
				.exists('li:nth-child('+i+') [data-css-rabfxd] [data-css-1k18vdk] span')
				.then();
		} catch(e) {
			console.log(e);
		}

		try {
			const result = await nightmare
			.click('li:nth-child('+i+') [data-css-rabfxd]')
			.wait('.css-c8e770 [data-css-gdcf1g] img')
			.evaluate(() => {
				let blurb = [];
				let fields = [];
				let values = [];
				let images = [];
				let size = "";
				if(document.querySelectorAll('.css-1ski12 span span').length > 0) {
					blurb = [...document.querySelectorAll('.css-1ski12 span span')]
					.map(el => el.innerText);
				} else {
					blurb = [...document.querySelectorAll('.css-1ski12 span')]
					.map(el => el.innerText);
				}
				fields = [...document.querySelectorAll('div table tr td span')]
				.map(el => el.innerText);
				values = [...document.querySelectorAll('div table tr td:last-child')]
				.map(el => el.innerText);
				images = [...document.querySelectorAll('.css-c8e770 [data-css-gdcf1g] img')]
					.map(el => el.src);
				size_element = document.querySelector('.css-pyswvh span:last-child');
				if(size_element !== null) {
					size = size_element.innerText;
					fields.push("size");
					values.push(size);
				}
				date_added = Date();
				return {blurb: blurb.map(line => line.replace('\n','').trim()).filter(line => line !== ''),
				fields: fields,
				values: values,
				images: images,
				date_added: date_added}
			})
			.then();
			result.is_sold = is_sold;
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

	await nightmare
		.end();
	return JSON.stringify(full_data, null, 4);
};

scrapeStore(username, show_window)
.then(a => {
	fs.writeFile("./scrape_data.json", a, function(err) {
		if(err) {
			return console.log(err);
		}
		return 'file saved';
	});
})
.catch(e => console.error(e));






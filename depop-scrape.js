'use strict';
const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: false, waitTimeout: 5000, executionTimeout: 1000 });
const fs = require('fs');
const vo = require('vo');

const username = process.argv[2];
const show_window = (process.argv[3] === 'true');
const blurb_selector = '.css-1ski12 span span';

const loadProfile = async (nightmare, startURL) => {
	try {
		await nightmare
			.goto(startURL)
			.wait('[data-css-rabfxd]');
	} catch (e) {
		console.log(e);
	}
}

const loadProduct = async (nightmare, targetIndex) => {
	return await nightmare
		.click(`li:nth-child(${targetIndex + 1}) [data-css-rabfxd]`)
		.wait('.ligytZ img')
		.then();
}

const scrollToBottom = async (nightmare, mode) => {
	try {
		let previousHeight, currentHeight = 0;
		while (previousHeight !== currentHeight) {
			previousHeight = currentHeight;
			currentHeight = await nightmare.evaluate(function () {
				return document.body.scrollHeight;
			});
			if (mode === 'profile') {
				await nightmare.scrollTo(currentHeight, 0)
					.wait(1000);
			} else if (mode === 'product') {
				await nightmare.scrollTo(previousHeight + 500, 0)
					.wait(1000);
			}
		}
	} catch (e) {
		console.log(e);
	}
}

const scrollToTarget = async (nightmare, targetIndex) => {
	try {
		let targetVisible = await nightmare
			.exists(`li:nth-child(${targetIndex + 1}) [data-css-rabfxd]`);
		let currentHeight = 0;
		while (!targetVisible) {
			currentHeight = await nightmare.evaluate(function () {
				return document.body.scrollHeight;
			})
			targetVisible = await nightmare
				.exists(`li:nth-child(${targetIndex + 1}) [data-css-rabfxd]`);
			await nightmare.scrollTo(currentHeight, 0)
				.wait(1000);
		}
		return;
	} catch (e) {
		console.log(e);
	}
}

const countInstancesOfSelector = async (nightmare, selector) => {
	try {
		return await nightmare
			.evaluate(selector => {
				return document.querySelectorAll(selector).length;
			}, selector) // <-- that's how you pass parameters from Node scope to browser scope
			.then(count => {
				return count;
			})
	} catch (e) {
		console.log(e);
	}
}

const getProductCount = async (nightmare) => {
	return await countInstancesOfSelector(nightmare, '[data-css-rabfxd]');
}

const checkIfProductSold = async (nightmare, targetIndex) => {
	try {
		return await nightmare
			.exists(`li:nth-child(${targetIndex + 1}) [data-css-rabfxd] [data-css-1k18vdk] span`)
			.then();
	} catch (e) {
		console.log(e);
	}
}

const scrapeProductData = async (nightmare) => {
	return await nightmare
	.evaluate(() => {
		let blurb, fields, values, images;
		if (document.querySelectorAll('.styles__DescriptionContainer-uwktmu-8').length > 0) {
			blurb = [...document.querySelectorAll('.styles__DescriptionContainer-uwktmu-8')]
				.map(el => el.innerText);
		} else {
			blurb = [...document.querySelectorAll('.css-1ski12 span')]
				.map(el => el.innerText);
		}
		fields = [...document.querySelectorAll('div table tr th')]
			.map(el => el.innerText);
		values = [...document.querySelectorAll('div table tr td')]
			.map(el => el.innerText);
		images = [...document.querySelectorAll('.ligytZ img')]
			.filter(el => el.src.length)
			.map(el => el.src);
		date_added = Date();
		const extraData = {};
		Object.keys(fields).forEach(index => extraData[fields[index]] = values[index]);
		return {
			blurb: blurb.map(line => line.replace('\n', '').trim()).filter(line => line !== ''),
			extraData,
			images,
			date_added
		}
	})
	.then(data => {
		return data;
	});
}

const scrapeProducts = async (nightmare, startURL, productCount) => {
	const fullData = [];

	for (let i = 15; i < productCount; i++) {
		console.log(`scraping product ${i + 1}/${productCount}`);
		await scrollToTarget(nightmare, i);

		let isSold = await checkIfProductSold(nightmare, i);

		try {
			if (!isSold) {
				await loadProduct(nightmare, i);
				await scrollToBottom(nightmare, 'product');

				const result = await scrapeProductData(nightmare);
				result.isSold = isSold;
				fullData.push(result);

				await loadProfile(nightmare, startURL);
			}
		} catch (e) {
			console.log(e);
		}
	}

	return fullData;
}

const scrapeStore = async (username, show_window) => {
	console.log(`now scraping from ${username}'s store`);
	const startURL = `https://www.depop.com/${username}`;
	const nightmare = new Nightmare({ show: show_window, height: 1024, width: 1024, waitTimeout: 5000, executionTimeout: 5000 });

	await loadProfile(nightmare, startURL);
	await scrollToBottom(nightmare, 'profile');
	const productCount = await getProductCount(nightmare);

	console.log(`${productCount} products to scrape`);

	const fullData = await scrapeProducts(nightmare, startURL, productCount);

	await nightmare
		.end();
	return JSON.stringify(fullData, null, 4);
};

const writeDataToFile = async (data) => {
	fs.writeFile("./output.json", data, function (err) {
		if (err) {
			return console.log(err);
		}
		return 'file saved';
	});
}

const main = async (username, show_window) => {
	const productData = await scrapeStore(username, show_window);
	writeDataToFile(productData);
}

main(username, show_window)
	.catch(e => console.error(e));






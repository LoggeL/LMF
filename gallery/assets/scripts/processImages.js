const fs = require('fs')
const CWebp = require('cwebp').CWebp;
const sharp = require('sharp')

const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');

const imageminJpegAutorotate = require('./imagemin-jpeg-autorotate');

let json = [];
const sizes = [['thumb', 20], ['small', 400], ['medium', 600], ['large', 800]];

(async () => {

    const files = await imagemin(['../img/original/*.jpg'], {
        plugins: [
            imageminJpegAutorotate({
                disable: false
            }),
            imageminJpegtran(),
        ]
    })

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const imgName = file.sourcePath.replace('../img/original/', '').replace('.jpg', '');
        const imgWidth = (await sharp(file.data).metadata()).width
        let img = { name: imgName, sizes: [] };
        for (let l = 0; l < sizes.length; l++) {
            let [sizeName, width] = sizes[l]

            if (imgWidth <= 400 && sizeName == 'medium') return
            if (imgWidth <= 600 && sizeName == 'large') return

            if (imgWidth < 200) return
            else if (imgWidth < 400 && sizeName == 'small') width = imgWidth
            else if (imgWidth < 600 && sizeName == 'medium' && imgWidth > 400) width = imgWidth
            else if (imgWidth < 800 && sizeName == 'large' && imgWidth > 600) width = imgWidth

            console.log(imgWidth, width)

            let data
            if (width === imgWidth) data = file.data
            data = await sharp(file.data)
                .resize({ width })
                .toBuffer()
            fs.writeFileSync(`../img/${sizeName}/${imgName}.jpg`, data)
            const encoder = new CWebp(data);
            const newMeta = await sharp(data).metadata()
            encoder.write(`../img/${sizeName}/${imgName}.webp`)
            img.sizes.push(sizeName)
        }
        json.push(img)
    }

    console.log('Saved')
    fs.writeFileSync('../data/images.json', JSON.stringify(json))
})()
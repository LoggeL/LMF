const webPsupport = (function () {
    const webP = new Image();
    webP.onload = WebP.onerror = function () {
        callback(webP.height == 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
});

const extension = webPsupport ? 'webp' : 'jpg'

fetch('assets/data/images.json').then(response => response.json().then(pictures => {

    const imageCount = pictures.length
    let loadCounter = 0
    const ul = document.createElement('ul')
    for (let i = 0; i < pictures.length; i++) {
        const picture = pictures[i]
        const li = document.createElement('li')
        const a = document.createElement('a')
        const img = document.createElement('img')
        const preloadImg = document.createElement('div')
        preloadImg.className = 'preload'
        preloadImg.style.opacity = '1'
        const shadow = document.createElement('div')
        shadow.className = 'shadow'
        const text = document.createElement('div')
        text.className = 'imageInfo'
        text.innerText = 'Text'
        a.href = `assets/img/original/${picture.name}.jpg`
        a.target = '_blank'

        img.setAttribute('src', `assets/img/thumb/${picture.name}.${extension}`)
        img.setAttribute('loading', 'lazy')

        img.onload = () => {
            console.log('Onload', img)
            loadCounter++
            if (loadCounter == imageCount) {
                // Hide Preloader
                const preloader = document.getElementById('preloader')
                preloader.style.opacity = '0'
                setTimeout(() => preloader.remove(), 1000)

                document.querySelectorAll('img[loading=lazy]').forEach(imgElem => {
                    const width = imgElem.clientWidth
                    let size = 'large'
                    if (width < 400) size = 'small'
                    else if (width < 600) size = 'medium'
                    const url = imgElem.getAttribute('src').replace('thumb', size)
                    const loadImg = document.createElement('img');
                    loadImg.onload = function () {
                        imgElem.nextElementSibling.style.opacity = '1'
                        imgElem.style.opacity = '0'
                        console.log("replace", url)
                    };

                    loadImg.setAttribute('src', url)
                    imgElem.nextElementSibling.style['background-image'] = `url('${url}')`
                })
            }
        }

        a.append(img)
        a.append(preloadImg)
        a.append(text)
        a.append(shadow)
        li.append(a)
        ul.append(li)
    }
    document.getElementById('gallery').append(ul)
}))
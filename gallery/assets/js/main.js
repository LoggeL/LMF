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
        a.href = `assets/img/large/${picture.name}.jpg`
        a.target = '_blank'

        img.setAttribute('src', `assets/img/thumb/${picture.name}.webp`)
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
                    const url = imgElem.getAttribute('src').replace('thumb', 'large')
                    const loadImg = document.createElement('img');
                    loadImg.onload = function () {
                        //preloadImg.style['background-image'] = `url('assets/img/large/${picture.name}.webp')`
                        imgElem.nextElementSibling.style.opacity = '1'
                        // setTimeout(() => 
                        imgElem.style.opacity = '0'
                        // , 5000)
                        console.log("replace", url)
                    };

                    loadImg.setAttribute('src', url)
                    imgElem.nextElementSibling.style['background-image'] = `url('${url}')`
                    // loadImg.setAttribute('src', `assets/img/large/${picture.name}.webp`)
                    // preloadImg.style['background-image'] = `url('assets/img/large/${picture.name}.webp')`
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
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
            img.nextElementSibling.style['background-image'] = `url('assets/img/large/${picture.name}.webp')`
            img.nextElementSibling.style['opacity'] = `1`
            loadCounter++
            if (loadCounter == imageCount) {
                // Hide Preloader
                const preloader = document.getElementById('preloader')
                preloader.style.opacity = 0
                setTimeout(() => preloader.remove(), 1000)
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
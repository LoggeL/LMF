fetch('assets/data/images.json').then(response => response.json().then(pictures => {
    const ul = document.createElement('ul')
    for (let i = 0; i < pictures.length; i++) {
        const picture = pictures[i]
        const li = document.createElement('li')
        const a = document.createElement('a')
        const img = document.createElement('img')
        const shadow = document.createElement('div')
        shadow.className = 'shadow'
        const text = document.createElement('div')
        text.className = 'imageInfo'
        text.innerText = 'Text'
        a.href = `assets/img/large/${picture.name}.jpg`
        a.target = '_blank'

        img.className = 'preload'
        img.setAttribute('src', `assets/img/thumb/${picture.name}.webp`)

        const img2 = document.createElement('img')
        img2.setAttribute('src', `assets/img/large/${picture.name}.webp`)
        img2.style.opacity = 0
        img2.onload = e => {
            e.target.style.opacity = 1
            setTimeout(() => img.remove(), 1000)
        }

        a.append(img)
        a.append(img2)
        a.append(text)
        a.append(shadow)
        li.append(a)
        ul.append(li)
    }
    document.getElementById('gallery').append(ul)
}))
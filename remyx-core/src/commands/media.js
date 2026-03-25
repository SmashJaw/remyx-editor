export function registerMediaCommands(engine) {
  engine.commands.register('embedMedia', {
    execute(eng, { url }) {
      if (!url) return

      const embedUrl = getEmbedUrl(url)
      if (!embedUrl) return

      const wrapper = document.createElement('div')
      wrapper.className = 'rmx-embed-wrapper'
      wrapper.setAttribute('contenteditable', 'false')
      wrapper.setAttribute('data-embed-url', url)

      const iframe = document.createElement('iframe')
      iframe.src = embedUrl
      iframe.setAttribute('frameborder', '0')
      iframe.setAttribute('allowfullscreen', 'true')
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups')
      iframe.setAttribute('allow', 'autoplay; picture-in-picture')
      iframe.style.width = '100%'
      iframe.style.height = '100%'

      wrapper.appendChild(iframe)
      eng.selection.insertNode(wrapper)

      // Add paragraph after embed
      const p = document.createElement('p')
      p.innerHTML = '<br>'
      wrapper.parentNode.insertBefore(p, wrapper.nextSibling)
    },
    meta: { icon: 'embedMedia', tooltip: 'Embed Media' },
  })

  engine.commands.register('removeEmbed', {
    execute(eng, { element }) {
      if (!element) return
      const wrapper = element.closest('.rmx-embed-wrapper') || element
      if (!wrapper.parentNode) return
      const p = document.createElement('p')
      p.innerHTML = '<br>'
      wrapper.parentNode.replaceChild(p, wrapper)
    },
    meta: { tooltip: 'Remove Embed' },
  })
}

function getEmbedUrl(url) {
  // YouTube
  let match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`
  }

  // Vimeo
  match = url.match(/(?:vimeo\.com\/)(\d+)/)
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}`
  }

  // Dailymotion
  match = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/)
  if (match) {
    return `https://www.dailymotion.com/embed/video/${match[1]}`
  }

  return null
}

/* eslint-env browser */

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { QuillBinding } from 'y-quill'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import DoUsername from 'do_username'
import { IndexeddbPersistence } from 'y-indexeddb'



Quill.register('modules/cursors', QuillCursors)

window.addEventListener('load', () => {
  const ydoc = new Y.Doc()
  const provider = new WebsocketProvider('ws://192.168.1.5:8080', 'quill-demo-2', ydoc)
  const offlineProvider = new IndexeddbPersistence('quill-demo-2', ydoc)
  const awareness = provider.awareness
  const documentList = ydoc.getArray('doc-list')
  const ytext = ydoc.getText('quill')
  const editorContainer = document.createElement('div')
  editorContainer.setAttribute('id', 'editor')
  document.body.insertBefore(editorContainer, null)
  var init = new Date()

  documentList.observeDeep(event => {
    console.log(JSON.stringify(event))
    document.querySelector('#latency').innerHTML = new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + ":" + new Date().getMilliseconds()
    document.querySelector('#diffInMs').innerHTML = Math.abs(new Date() - init) / 1000;
    init = new Date()
  })

  provider.on('status', event => {
    document.querySelector('#connStatus').innerHTML = event.status    
  })
  offlineProvider.on('synced', (data) => {
    console.log('content from the database is loaded', data)
  })

  provider.on('synced', () => {
    console.log('synced!')
  }) 

  let quill = null
  let binding = null
  // Bind editor to a new ytext type
  const bindEditor = ytext => {
    if (binding) {
      // We can reuse the existing editor. But we need to remove all event handlers
      // that we registered for collaborative editing before binding to a new editor binding
      binding.destroy()
    }
    if (quill === null) {
      // This is the first time a user opens a document.
      // The editor has not been initialized yet.
      // Create an editor instance.
      quill = new Quill(document.querySelector('#editor'), {
        modules: {
          cursors: true,
          toolbar: [
            // adding some basic Quill content features
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            ['image', 'code-block']
          ],
          history: {
            // Local undo shouldn't undo changes
            // from remote users
            userOnly: true
          }
        },
        placeholder: 'Start collaborating...',
        theme: 'snow' // 'bubble' is also great
      })
    }

    // "Bind" the quill editor to a Yjs text type.
    // The QuillBinding uses the awareness instance to propagate your cursor location.
    binding = new QuillBinding(ytext, quill, awareness)
  }


  const docsDiv = document.querySelector('#docs')

  const renderDocs = (event) => {

    // render documents to an HTML string (e.g. '<input type button index="0" value="Document 0" /><input ...')
    const docs = documentList.toArray().map((ytext, i) => `<input type="button" index=${i} value="Document ${i}" />`).join('')
    // insert the list of all docs. But the first one is a "create new document" button
    docsDiv.innerHTML = '<input type="button" index="new" value="+ Create New Document" /><input type="button" index="clear" value="- Delete All" />' + docs
    if (documentList.length === 0) {
      // A user deleted all documents. Clear the editor content & binding.
      if (binding) {
        binding.destroy()
      }
      if (quill) {
        quill.setContents('')
      }
    }
  }

  // render initial docs list
  renderDocs()
  // every time a document is added, we rerender the list of documents.
  documentList.observe(renderDocs)

  docsDiv.addEventListener('click', event => {
    //console.log(event)
    const pressedButton = event.target
    const val = pressedButton.getAttribute('index')
    
    if (val === 'new') {
      // create a new document
      const newDoc = new Y.Text()
      // Set initial content with the headline being the index of the documentList
      newDoc.applyDelta([{ insert: `Document #${documentList.length}` }, { insert: '\n', attributes: { header: 1 } }, { insert: '\n' }])
      documentList.push([newDoc])
      bindEditor(newDoc)
    } else if (val === "clear") {
      // remove all documents
      documentList.delete(0, documentList.length)
    } else {
      // The index is a number, render the $i-th document
      const index = Number.parseInt(val)
      bindEditor(documentList.get(index))
    }
  })

  // -- This is the same as in the previous chapter. We render the list of active users and assign them colors.

  // (optional) Remove the selection when the iframe is blurred
  window.addEventListener('blur', () => { if (quill) { quill.blur() } })

  const usercolors = [
    '#30bced',
    '#6eeb83',
    '#ffbc42',
    '#ecd444',
    '#ee6352',
    '#9ac2c9',
    '#8acb88',
    '#1be7ff'
  ]
  const myColor = usercolors[Math.floor(Math.random() * usercolors.length)]
  const inputElement = document.querySelector('#username')
  // propagate the username from the input element to all users
  const setUsername = () => {
    awareness.setLocalStateField('user', { name: inputElement.value, color: myColor })
  }
  // observe changes on the input element that contains the username
  inputElement.addEventListener('input', setUsername)

  // Render a list of usernames next to the editor whenever new information is available from the awareness instance
  awareness.on('change', () => {
    // Map each awareness state to a dom-string
    const strings = []
    awareness.getStates().forEach(state => {
      //console.log(state)
      if (state.user) {
        strings.push(`<div style="color:${state.user.color};">• ${state.user.name}</div>`)
      }
      document.querySelector('#users').innerHTML = strings.join('')

    })
  })

  // Set a randomly generated username - this is nice for testing
  inputElement.value = DoUsername.generate(15)
  setUsername()


  const connectBtn = document.getElementById('y-connect-btn')
  connectBtn.addEventListener('click', () => {
    if (provider.shouldConnect) {
      provider.disconnect()
      connectBtn.textContent = 'Connect'
    } else {
      provider.connect()
      connectBtn.textContent = 'Disconnect'
    }
  })

  const offlineBtn = document.getElementById('y-off-btn')
  offlineBtn.addEventListener('click', () => {
    console.log(JSON.stringify(documentList))
    offlineProvider.set(0, JSON.stringify(documentList))
  })

  const retrieve = document.getElementById('retrieve')
  retrieve.addEventListener('click', async() => {
    var data = await offlineProvider.get(0)
    document.querySelector('#retrieved').innerHTML = data
  })


  // @ts-ignore
  window.example = { provider, ydoc, ytext, binding, Y, offlineProvider }
})

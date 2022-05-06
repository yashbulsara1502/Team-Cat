import * as Automerge from 'automerge'
import socketIOClient  from 'socket.io-client'

window.addEventListener('load', () => {
    let doc1 = Automerge.init()
    var init = new Date()
    document.querySelector('#currTime').innerHTML = new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + ":" + new Date().getMilliseconds()
    //const ws = new WebSocket('ws://192.168.1.4:8082');
    const socket = socketIOClient("http://localhost:8082")


    socket.on("FromAPI", data => {
        console.log(data)
    })

    socket.on('getData', data => {
        console.log(data)    
    })

    socket.on('typing', data=>{
        console.log("message recieved", data)
        doc1 = Automerge.change(doc1, doc => {
            doc.text = new Automerge.Text()
            let newData = doc1.text.toString().concat(data)
            doc.text.insertAt(0, newData)
        })
        console.log("socket value",doc1.text.toString())
        var value = doc1.text.toString();
        document.getElementById('spanAuto').innerHTML = value;
        document.querySelector('#autoDiffInMs').innerHTML = Math.abs(new Date() - init) / 1000;
        init = new Date()
    })


    doc1 = Automerge.change(doc1, doc => {
        doc.text = new Automerge.Text()
        doc.text.insertAt(0, "hello")
    })
    

    document.querySelector('#inputAuto').addEventListener('change', function (event) {
        console.log('You selected: ', this.value);
        socket.emit('typing',this.value )
    });


})
const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.command = functions.database
        .ref('/actions/{uid}/{cmd_id}')
        .onWrite(event => {

    const uid = event.params.uid
    const cmd_id = event.params.cmd_id

    if (! event.data.exists()) {
        console.log(`action was deleted ${cmd_id}`)
        return
    }

    const command = event.data.val()
    const actionName = command.action
    const itemName = command.name
    const userName = command.user
    const photoUrl = command.photoUrl

    console.log(`command ${actionName} uid=${uid} cmd_id=${cmd_id}`)
    const root = event.data.adminRef.root
    let pr_cmd
    switch (actionName) {
        case 'add':
            pr_cmd = add(root, uid, itemName, userName, photoUrl)
            break

        case 'delete':
            pr_cmd = remove(root, uid, itemName)
            break

        default:
            console.log(`Unknown command: ${actionName}`)
            pr_cmd = Promise.reject("Unknown command")
            break
    }
    const pr_remove = ''
    // const pr_remove = event.data.adminRef.remove()
    return Promise.all([pr_cmd, pr_remove])
})

function add(root, uid, itemName, userName, photoUrl) {
    const ref_items = root.child(`items/added/{item_id}/`)
    return ref_items.once("value")
    .then(snap => {
      console.log('new item: '+itemName);
      item = {name:itemName, user:userName, photoUrl:photoUrl}
      const ref_item = root.child(`items/added/`)
      const pr_push = ref_item.push(item)
      return Promise.all([pr_push])
    })
    .catch(e =>{
      throw new Error('error!')
    })
}

class DemoApp {
    constructor() {
        this.db = firebase.database()

    }

    onLoad(event) {
        this._initUi()
        this._initFirebaseAuth()
    }

    _initUi(){

        // Shortcuts to DOM Elements.
        this.itemList = document.getElementById('items');
        this.loginScreen = document.getElementById("login-screen")
        this.listScreen = document.getElementById("list-screen")
        this.userNav = document.getElementById("user_nav")
        this.guestNav = document.getElementById("guest_nav")
        this.itemUser = null
        this.ITEM_TEMPLATE =
              '<div style="margin-left:30%" class="uk-card uk-card-default uk-card-body uk-width-1-3@m uk-text-center item-container">' +
                '<div class=""><div class="pic"></div></div>' +
                '<div class="item"></div>' +
                '<div class="username"></div>' +
              '<hr></div>'

        this.ITEM_TEMPLATE2 = '<div class="item-container">'+
                                '<article class="uk-column-1-5 uk-comment">'+
                                  '<header class="uk-column-1-2">'+
                                  '    <img class="uk-comment-avatar pic" width="60" height="60" src="" alt="">'+
                                  '    <h4 class="uk-comment-title username"></h4>'+
                                  '    <ul class="uk-comment-meta uk-subnav"></ul>'+
                                  '</header>'+
                                  '    <div class="uk-comment-body item"></div>'+
                                '</article><hr>'+
                              '</div>'

        this.allScreens = [ this.loginScreen, this.listScreen]
        this.navStyles = [ this.userNav, this.guestNav]

        this.currentScreen = null
        this.currentNav = null
        this._showScreen(this.loginScreen)

         const btn_add = document.getElementById("js-modal-prompt")
         btn_add.addEventListener("click", event => {
           UIkit.modal.prompt('Add an Item:','').
           then(function (name) {
             if(name){
               app._addItem(name)
             }
           });
         })

        const btn_sign_in = document.getElementById("btn-sign-in")
        btn_sign_in.addEventListener("click", event => {
            var provider = new firebase.auth.GoogleAuthProvider()
            provider.addScope("profile")
            firebase.auth().signInWithRedirect(provider)
            firebase.auth().getRedirectResult()
            .then(result => {
                console.log("auth success")
                console.log(result)
                // This gives you a Google Access Token. You can use it to access the Google API.
                var token = result.credential.accessToken
                // The signed-in user info.
                var user = result.user
                // ...
            })
            .catch(error => {
                console.log("auth error")
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // The email of the user's account used.
                var email = error.email;
                // The firebase.auth.AuthCredential type that was used.
                var credential = error.credential;
                // ...
            })
        })

        const btn_sign_out = document.getElementById("btn-sign-out")
        btn_sign_out.addEventListener("click", event => {
            firebase.auth().signOut()
        })

    }

    _addItem(itemName){
      const action = { action:"add", name:itemName, user:this.user.displayName, photoUrl:this.user.photoURL}
      this.refActions.push(action).then(result => {
        UIkit.modal.alert(itemName+' added!').then(function () {
               console.log(itemName+' added!')
           });
        })
    }

    _showScreen(screen) {
          this.allScreens.forEach(sc => {
              if (sc === screen) {
                  sc.style.display = ""
                  this.currentScreen = screen
              }
              else {
                  sc.style.display = "none"
              }
          })
      }

      _showNav(option) {
            this.navStyles.forEach(nv => {
                if (nv === option) {
                    nv.style.display = ""
                    this.currentNav = option
                }
                else {
                    nv.style.display = "none"
                }
            })
        }

    _initFirebaseAuth(){
        firebase.auth().onAuthStateChanged(this._onAuthStateChanged.bind(this))
    }

    _onAuthStateChanged(user) {
        if (user) {
            console.log(`signed in ${user.displayName}`)
            console.log(user)
            this._onSignIn(user)
            if (this.currentScreen === this.loginScreen || !this.currentScreen) {
                this._showScreen(this.listScreen)
                this._loadItems()
            }
        }
        else {
            console.log("signed out")
            this._onSignOut()
            this._showScreen(this.loginScreen)
        }
      }

      _loadItems(){

        // Reference to the /items/ database path.
        this.itemsRef = this.db.ref('items/added/');

        // Loads the last 12 messages and listen for new ones.
        var setItem = function(data) {
          var val = data.val();
          this._displayItem(data.key, val.name, val.user, val.photoUrl);
        }.bind(this)

        // Make sure we remove all previous listeners.
        this.itemsRef.off();
        this.itemsRef.limitToLast(12).on('child_added',setItem)
        this.itemsRef.limitToLast(12).on('child_changed',setItem)

      }



      _displayItem(key, itemName, userName, photoUrl) {
        var div = document.getElementById(key);

        // If an element for that message does not exists yet we create it.
        if (!div) {
            var container = document.createElement('DIV');
            container.innerHTML = this.ITEM_TEMPLATE2;
            // console.log(container);
            div = container.firstChild;
            // console.log(div);
            div.setAttribute('id', key);
            this.itemList.appendChild(div);
        }

        var picUrl = photoUrl
        if (picUrl) {
            div.querySelector('.pic').setAttribute('src', picUrl)
        }
        div.querySelector('.username').textContent = userName;

        var messageElement = div.querySelector('.item');
        messageElement.textContent = itemName;
        messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');

      }

      _onSignIn(user) {
          this.user = user
          this.refActions = this.db.ref(`/actions/${user.uid}`)
          this.db.ref(`/users/${user.uid}`).update({
              displayName: user.displayName,
              photoUrl: user.photoURL
          })
          this._showNav(this.userNav)
          this._updateUserUi()
      }

      _updateUserUi() {
          const _user = this.user
          const name = _user.displayName === "" ? "???" : _user.displayName
          console.log(name)
          document.getElementById("name").textContent = name


      }

      _onSignOut() {

          this.refCommands = undefined
          this.user = null

          if (this.checkin) {
              clearInterval(this.checkin)
              this.checkin = undefined
          }

          this._reset()
          this._showNav(this.guestNav)
      }
}

const app = new DemoApp()
window.addEventListener("load", app.onLoad.bind(app))

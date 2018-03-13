$(document).ready(function () {
    let dspChannels = $("#dspChannels");
    let dspCurrentChannel = $("#dspCurrentChannel");
    let dspUserList = $("#dspUserList");
    let dspCurrentUser = $("#dspCurrentUser");
    let txtMessage = $("#txtMessage");
    let chatContents = $("#chatContents");
    let btnSend = $("#btnSend");
    let chatApp = $("#chatApp");
    let image = $('<img>');
    let userInfo = JSON.parse(localStorage.getItem('chatappCurrentUserInfo'));
    auth.onAuthStateChanged(function(user) {
        if (user) {
            //User is signed in.
            //Get current user display name
            let currentUserDisplayName = $("<b>").text(userInfo.displayName);
            dspCurrentUser.append(currentUserDisplayName);

            if (userInfo.photoUrl === "") {
                dspCurrentUser.prepend("<p><img src='../images/icon-user.png'></p>");
            }
            else {
                image.attr('src', userInfo.photoUrl);
                let imageContainer = $('<p>');
                imageContainer.append(image);
                dspCurrentUser.prepend(imageContainer);
            }

           //Show ChatApp content
            chatApp.removeClass("chatApp-hidden");

            //Get components
            getChannels();
            getUserList();

            //Get messages in default channel
            let objDefaultChannel = getDefaultChannel();
            objDefaultChannel.then(function (result) {
                let defaultChannelId = Object.keys(result)[0];
                let defaultChannelName = result[defaultChannelId].channelName;
                storeChannel(defaultChannelId,defaultChannelName);
            });

            //Assign onclick function to button Send end Enter key
            btnSend.click(function(){sendAMessage(user);});

            //Handle enter key
            $(document).keydown(function(event) {
                let keycode = (event.keyCode ? event.keyCode : event.which);
                if (keycode === '13'){
                    //K modified
                    //sendAMessage(user);
                    event.preventDefault();
                    btnSend.click();
                }
            });
        } else {
            // No user is signed in.
            //$("#lnkSignOut").hide();
            goToSignIn();
        }
    });

    //FUNCTIONS
    //Channels
    function getChannels() {
        let nodeRef = database.ref("channels/").orderByChild("channelName");
        nodeRef.on('value',function (snapshot) {
            dspChannels.html("<h3>Channels</h3>");//clear the display before get new data
            snapshot.forEach(function (childSnapshot) {
                buildAChannelLink(childSnapshot.val(),childSnapshot.key);
            });
        });
    }
    function buildAChannelLink(objData, objKey) {
        let channelLink = $("<p>")
            .addClass("channel-item")
            .text("# "+objData.channelName)
            .click(function () {storeChannel(objKey,objData.channelName)});
        dspChannels.append(channelLink);
    }
    function storeChannel(channelId,channelName) {
        if (typeof(Storage) !== "undefined") {
            sessionStorage.chatappChannelId = channelId;
            dspCurrentChannel.text("# "+channelName);
            getMessages(channelId);//reload all messages which are in the chosen channel
        }
    }
    function retrieveChannel() {
        if (typeof(Storage) !== "undefined" && sessionStorage.chatappChannelId){
            return sessionStorage.chatappChannelId;
        }else
            return false
    }
    function getDefaultChannel() {
        let nodeRef = database.ref("channels/").orderByChild("defaultChannel").equalTo(true);
        return nodeRef.once("value")
            .then(function (snapshot) {
                return snapshot.val();
            })
            .catch(function () {});
    }

    //Users
    function getUserList() {
        let nodeRef = database.ref("users/").orderByChild("displayName");
        nodeRef.on('value',function (snapshot) {
            dspUserList.html(" ");//clear the display before get new data
            snapshot.forEach(function (childSnapshot) {
                buildAnUser(childSnapshot.val());
            });
        });
    }
    function buildAnUser(objData) {
        let displayName = $("<p>").text(objData.displayName);
        let statusDot = $('<span>').text('●\t');

        if (objData.isOnline) {
            displayName.addClass("userlist-online");
        }

        else {
            displayName.addClass("userlist-offline");
        }
        displayName.prepend(statusDot);
        dspUserList.append(displayName);
    }

    //Messages
    function sendAMessage(user) {
        if (user){
            let channelId = retrieveChannel();
            let newKey = database.ref("messages/").push().key;
            let nodeRef = database.ref("messages/" + newKey);
            let message = txtMessage.val();

            nodeRef.set({
                userId: user.uid,
                displayName: userInfo.displayName,
                channelId: channelId,
                content: message,
                timeStamp: getCurrentDate() + " " + getCurrentTime()
            })
                .then(function () {txtMessage.val("");})
                .catch(function(error) {writeToLogs(error.code, "fnSendAMessage: "+error.message);});
        }
        else{return false}
    }
    function getMessages(channelId) {
        if (parseInt(channelId)){
            let nodeRef = database.ref("messages/").orderByChild("channelId").equalTo(channelId);
            nodeRef.on('value',function (snapshot) {
                chatContents.html("");//clear the display before get new data
                snapshot.forEach(function (childSnapshot) {
                    buildAMessage(childSnapshot.val());
                });

                //K moved
                scrollChatContents();
                txtMessage.focus();
            });
        }
        else{return false}
    }
    function buildAMessage(objData) {
        let displayName = $("<b>").text(objData.displayName);
        let dsplTime = objData.timeStamp.substr(objData.timeStamp.indexOf(' ') + 1);
        let timeStamp = $("<i>").text(' ' + dsplTime + ' ');
        let messageBox = $('<div>');
        messageBox.addClass('messageBox');
        let message = $("<p>").text(" " + objData.content + " ");

        messageBox.append(displayName);
        messageBox.append(timeStamp);
        messageBox.append(message);

        chatContents.append(messageBox);
        //scrollChatContents();
    }

    function scrollChatContents() {
        let wtf = $('#chatContents');
        let height = wtf[0].scrollHeight;
        wtf.scrollTop(height);
    }
});

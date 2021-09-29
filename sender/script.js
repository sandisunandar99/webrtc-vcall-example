/**
 * script sender 
 */

const webSocket = new WebSocket('ws://192.168.100.157:3000');
 
webSocket.onmessage = function (event) {  
    handleSignalData(JSON.parse(event.data))
}

function handleSignalData(data) {  
    switch(data.type) {
        case "answer":
            peerConn.setRemoteDescription(new RTCSessionDescription(data.answer));
            break;
        case "candidate":
            peerConn.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
        default:
            console.log("Invalid message type");
            break;
    }
}

let username

function sendUsername() {  
    username = document.getElementById("username-input").value;
    sendData({
        type: "store_user",
    });
}

function sendData(data) {  
    data.username = username;
    webSocket.send(JSON.stringify(data));
}

let localStreams
let peerConn // global variable untuk peer connection
function startCall() {
    document.getElementById("video-call-div").style.display = "inline";

    //TODO: di firefox permission nya ga keluar perlu di perbaiki

    // untuk mengaktifkan video permission pada aplikasi browser web
    navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia;

    if (navigator.getUserMedia) {
        navigator.getUserMedia(
            { 
                audio: true,
                video: { 
                    frameRate: { ideal: 10, max: 15 },
                    width: { min: 480, ideal: 720, max: 1280 },
                    aspectRatio: 1.33333
                }
            },
            function(stream) {
                localStreams = stream;
                var video = document.getElementById('local-video');
                video.srcObject = localStreams;
                video.onloadedmetadata = function(e) {
                    video.play();
                };

                //inisialisasi koneksi dengan STUN server menggunakan server public
                let configuration = {
                    iceServers : [
                        {
                            "urls" : [
                                "stun:stun2.l.google.com:19302",
                                "stun:stun3.l.google.com:19302",
                                "stun:stun4.l.google.com:19302"

                            ]
                        }
                    ]
                } // end 


                peerConn = new RTCPeerConnection(configuration);
                peerConn.addStream(localStreams);

                peerConn.onaddstream = function(e) {
                    var remote  = document.getElementById('remote-video');
                    remote.srcObject = e.stream;
                }


                peerConn.onicecandidate = function(e) {
                    if (!e.candidate) {
                        return
                    }

                    sendData({
                        type: "store_candidate",
                        candidate: e.candidate
                    });
                }

                // event handler untuk menangkap sdp offer
                createAndSendOffer();

            },
            function(err) {
                console.log("The following error occurred: " + err.name);
            }
        );
    } else {
        console.log("getUserMedia not supported");
    }
}

function createAndSendOffer() {  
    peerConn.createOffer(
        function(offer) {
            peerConn.setLocalDescription(offer);
            sendData({
                type: "store_offer",
                offer: offer
            });
        },
        function(err) {
            console.log("Error when creating an offer");
        }
    );
}

let isAudioMuted = true;
function muteAudio() {
   isAudioMuted = !isAudioMuted;
   localStream.getAudioTracks()[0].enabled = isAudioMuted
}

let isVideoMuted = true;
function muteVideo() {
    isVideoMuted = !isVideoMuted;
    localStream.getVideoTracks()[0].enabled = isVideoMuted
}
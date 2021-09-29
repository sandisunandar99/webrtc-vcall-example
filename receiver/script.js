/**
 * script receiver 
 */

const webSocket = new WebSocket('ws://192.168.100.157:3000');
 
webSocket.onmessage = function (event) {  
    handleSignalData(JSON.parse(event.data))
}

function handleSignalData(data) {
    switch(data.type) {
        case "offer":
            peerConn.setRemoteDescription(new RTCSessionDescription(data.offer));
            createAndSendAnswer();
            break;
        case "candidate":
            peerConn.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
        default:
            console.log("Invalid message type");
            break;
    }
}

function createAndSendAnswer() {  
    peerConn.createAnswer(
        function(answer) {
            peerConn.setLocalDescription(answer);
            sendData({
                type: "send_answer",
                answer: answer
            });
        },
        function(err) {
            console.log("Error when creating an answer", err.name);
        }
    );
}


function sendData(data) {  
    data.username = username;
    webSocket.send(JSON.stringify(data));
}

let username
let localStreams
let peerConn // global variable untuk peer connection

function joinCall() {
    username = document.getElementById("username-input").value;

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
                    if (e.candidate == null) {
                        return
                    }

                    sendData({
                        type: "send_candidate",
                        candidate: e.candidate
                    });
                }

                sendData({
                    type: "join_call",
                    username: username
                })

            },
            function(err) {
                console.log("The following error occurred: " + err.name);
            }
        );
    } else {
        console.log("getUserMedia not supported");
    }
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
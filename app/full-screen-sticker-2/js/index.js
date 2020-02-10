// CSS MANIPULATIONS
setTimeout(function() {
     document.getElementById("information").style.display = "none";
}, 5000);

// CANVAS SETUP + VARIABLES
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// Emoji array created by Github user anthonydelgado: https://gist.github.com/anthonydelgado/528d1fab9242067348c0ac25f873d7f0
var emojiArray = ["✌", "😂", "😝", "😁", "😱", "👉", "🙌", "🍻", "🔥", "🌈", "☀", "🎈", "🌹", "💄", "🎀", "⚽", "🎾", "🏁", "😡", "👿", "🐻", "🐶", "🐬", "🐟", "🍀", "👀", "🚗", "🍎", "💝", "💙", "👌", "❤", "😍", "😉", "😓", "😳", "💪", "💩", "🍸", "🔑", "💖", "🌟", "🎉", "🌺", "🎶", "👠", "🏈", "⚾", "🏆", "👽", "💀", "🐵", "🐮", "🐩", "🐎", "💣", "👃", "👂", "🍓", "💘", "💜", "👊", "💋", "😘", "😜", "😵", "🙏", "👋", "🚽", "💃", "💎", "🚀", "🌙", "🎁", "⛄", "🌊", "⛵", "🏀", "🎱", "💰", "👶", "👸", "🐰", "🐷", "🐍", "🐫", "🔫", "👄", "🚲", "🍉", "💛", "💚"]
var xPositions = [window.innerWidth / 2, window.innerWidth / 4, window.innerWidth / 4 * 3, window.innerWidth / 8, window.innerWidth / 8 * 7];
var yPositions = [0, 0, 0, 0, 0];
var arrayOfCurrentEmojis = [];

// CORE EMOJI FUNCTION
var emojiDrops = function() {
     ctx.font = '30px serif';
     for (var i = 0; i < xPositions.length; i++) {
          arrayOfCurrentEmojis.push(emojiArray[Math.floor((Math.random() * emojiArray.length - 1) + 1)]);
          ctx.fillText(arrayOfCurrentEmojis[i], xPositions[i], yPositions[i]);

          // this will make every emoji move in a random speed, so it looks more realistic
          yPositions[i] += Math.floor((Math.random() * 5) + 2);

          // if any emoji reaches the end, it will return to the top
          for (var k = 0; k < yPositions.length; k++) {
               if (yPositions[k] >= window.innerHeight) {
                    yPositions[k] = 0;
               }
          }
     }
};

// INIT
function draw() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
     emojiDrops();
     window.requestAnimationFrame(draw);
}
draw();

// MOUSE EVENTS
document.getElementById("canvas").addEventListener("click", function(event) {
     xPositions.push(event.pageX);
     yPositions.push(event.pageY);
}, false);
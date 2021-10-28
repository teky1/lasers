class LineVisualizer{
  constructor(angle, color){
    this.angle = angle;
    this.color = color;
  }
  draw(){
    let maxDist = Math.hypot(canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, canvas.height/2);
    let targetX = Math.cos(this.angle)*maxDist+canvas.width/2;
    let targetY = Math.sin(this.angle)*maxDist+canvas.height/2;
    ctx.lineTo(targetX, targetY);
    ctx.strokeStyle = this.color;
    ctx.stroke();
    ctx.closePath();
  }
}
class Mirror {
  constructor(x1, y1, x2, y2){
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.mirrorLength = Math.hypot(this.x1-this.x2, this.y1-this.y2);
    this.dotsColor = "#0362fc";
    this.mirrorColor = "#ffffff";
    this.isBeingClicked = 0;
  }
  isOnHandles(mouseX, mouseY, returnType){
    var dist1 = Math.hypot(this.x1-mouseX, this.y1-mouseY);
    var dist2 = Math.hypot(this.x2-mouseX, this.y2-mouseY);
    if(dist1 <= canvas.width/164){
      return 1;
    } else if(dist2 <= canvas.width/164){
      return 2;
    } else {
      return 0;
    }
  }
  moveAll(newX, newY){
    if(this.isBeingClicked==1){
      var offsetX = newX - this.x1;
      var offsetY = newY - this.y1;
    } else if(this.isBeingClicked==2){
      var offsetX = newX - this.x2;
      var offsetY = newY - this.y2;
    }
    this.x1 += offsetX;
    this.x2 += offsetX;
    this.y1 += offsetY;
    this.y2 += offsetY;

  }
  rotateOne(newX, newY){

    if(this.isBeingClicked==1){
      this.x1 = newX;
      this.y1 = newY;
    } else {
      this.x2 = newX;
      this.y2 = newY;
    }

  }
  draw(){

    ctx.strokeStyle = this.mirrorColor;
    ctx.lineWidth = canvas.width/328;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
    ctx.closePath();


    ctx.fillStyle = this.dotsColor;
    ctx.beginPath();
    ctx.arc(this.x1, this.y1, canvas.width/164, 0, 2*Math.PI);
    ctx.arc(this.x2, this.y2, canvas.width/164, 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();
  }
}

class Laser {
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.angle = Math.PI/4;
    this.maxReflections = 10000;
  }
  doesIntersect(originX, originY, targetX, targetY, mirror){

    let x1 = originX; let y1 = originY;
    let x2 = targetX; let y2 = targetY;
    let x3 = mirror.x1; let y3 = mirror.y1;
    let x4 = mirror.x2; let y4 = mirror.y2;

    // intersection checker code from http://paulbourke.net/geometry/pointlineplane/javascript.txt
    // Check if none of the lines are of length 0
  	if ((x1 == x2 && y1 == y2) || (x3 == x4 && y3 == y4)) {
  		return false;
  	}

  	let denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

    // Lines are parallel
  	if (denominator == 0) {
  		return false;
  	}

  	let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  	let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    // is the intersection along the segments
  	if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
  		return false;
	  }

    // Return a object with the x and y coordinates of the intersection
  	let x = x1 + ua * (x2 - x1)
  	let y = y1 + ua * (y2 - y1)

  	return [x, y];
  }
  draw(){
    ctx.lineWidth = 1;
    let originX = this.x;
    let originY = this.y;
    let currentAngle = this.angle;
    let maxDist = Math.hypot(canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    for(let i = 0; i < this.maxReflections; i++){
      let targetX = Math.cos(currentAngle)*maxDist+originX;
      let targetY = Math.sin(currentAngle)*maxDist+originY;
      let closestDist = 100000;
      let closestMirror = 0;
      let closestIntersectionCoords = [0, 0];
      for(let mirror of mirrors){
        let isIntersect = this.doesIntersect(originX, originY, targetX, targetY, mirror);
        if(isIntersect){
          let distFromOrigin = Math.hypot(originX-isIntersect[0], originY-isIntersect[1]);
          if(distFromOrigin<closestDist && isIntersect[0].toFixed(4) != originX.toFixed(4) &&
          isIntersect[1].toFixed(4) != originY.toFixed(4)){
            closestDist = distFromOrigin;
            closestMirror = mirror;
            closestIntersectionCoords = [isIntersect[0], isIntersect[1]];
          }
        }
      }
      // console.log(i, originX, originY, closestIntersectionCoords,  closestDist);
      if(closestMirror == 0){
        ctx.lineTo(targetX, targetY);
        break;
      }

      ctx.lineTo(closestIntersectionCoords[0], closestIntersectionCoords[1]);
      let laserAngle = slopeToAngle(closestIntersectionCoords[1]-originY, closestIntersectionCoords[0]-originX);
      let mirrorAngle = slopeToAngle(closestMirror.y2-closestMirror.y1, closestMirror.x2-closestMirror.x1);

      // if(i==0){console.log(laserAngle/Math.PI*180, mirrorAngle/Math.PI*180);}
      currentAngle = calculateReflection(laserAngle, mirrorAngle, i);

      originX = closestIntersectionCoords[0];
      originY = closestIntersectionCoords[1];

    }
    ctx.strokeStyle = "#FF0000";
    ctx.stroke();
    ctx.closePath();
  }
}
const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');

const backgroundColor = '#2C2F33';
var userIsClicking = false;
var userIsClickingShift = false;
var userIsClickingR = false;
var userIsClickingM = false;
var currentMouseX = 0;
var currentMouseY = 0;
var mirrors = [];
var visualizers = [];

function initiateFrame(){
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.fillStyle = '#2C2F33';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mouseup", onMouseUp);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener('mouseleave', onMouseUp);
document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

function slopeToAngle(opp, adj){
  let answer;
  if(adj==0){
    answer =  Math.PI;
  } else {
    answer = Math.atan(opp/adj);
  }
  if(adj < 0){
    answer += Math.PI;
  }
  // console.log(opp, adj, answer)
  return answer;
}

function calculateReflection(laserAngle, mirrorAngle, i){
  console.log(i, laserAngle, mirrorAngle, (mirrorAngle - laserAngle + mirrorAngle));
  return mirrorAngle - laserAngle + mirrorAngle;
}

function onMouseDown(e){
  userIsClicking = true;
  aMirrorIsBeingClicked = false;
  for(let mirror of mirrors){
    if(mirror.isBeingClicked > 0){
      aMirrorIsBeingClicked = true;
    }
  }
  if(!aMirrorIsBeingClicked){
    for(let mirror of mirrors){
      let result = mirror.isOnHandles(e.clientX, e.clientY);
      if(result > 0){
        mirror.isBeingClicked = result;
        break;
      }
    }
  }
}

function onMouseUp(e){
  userIsClicking = false;
  for(let mirror of mirrors){
    mirror.isBeingClicked = 0;
  }
}

function onMouseMove(e){
  currentMouseX = e.pageX;
  currentMouseY = e.pageY;
  if(!userIsClicking){
    let isOverHandle = false;
    for(let mirror of mirrors){
      if(mirror.isOnHandles(e.pageX, e.pageY)>0){
        isOverHandle = true;
        break;
      }
    }
    if(isOverHandle){
      canvas.style.cursor = "pointer";
    } else {
      canvas.style.cursor = "default";
    }

  } else if(userIsClicking && userIsClickingShift) {
    for(let mirror of mirrors){
      if(mirror.isBeingClicked > 0){
        mirror.rotateOne(e.pageX, e.pageY);
      }
    }
  } else if(userIsClicking && !userIsClickingShift){
    for(let mirror of mirrors){
      if(mirror.isBeingClicked > 0){
        mirror.moveAll(e.pageX, e.pageY);
      }
    }
  }
}

function onKeyDown(e){
  switch(e.key){
    case "Shift":
      userIsClickingShift = true;
      break;
    case "r":
      userIsClickingR = true;
      break;
    case "m":
      if(!userIsClickingM){
        let randomAngle = Math.random()*2*Math.PI;
        let newLength = canvas.width/20;
        mirrors.push(new Mirror(currentMouseX, currentMouseY,
          Math.cos(randomAngle)*newLength+currentMouseX, Math.sin(randomAngle)*newLength+currentMouseY));
      }
      userIsClickingM = true;
      break;
  }
}

function onKeyUp(e){
  switch(e.key){
    case "Shift":
      userIsClickingShift = false;
      break;
    case "r":
      userIsClickingR = false;
      break;
    case "m":
      userIsClickingM = false;
      break;
  }
}

function addVisualizer(angle, color){
  visualizers.push(new LineVisualizer(angle, color));
}

initiateFrame();
var laser = new Laser(canvas.width/2, canvas.height/2);


function drawFrame(){
  initiateFrame();

  for(let visualizer of visualizers){
    visualizer.draw();
  }
  laser.draw();
  for(let mirror of mirrors){
    mirror.draw();
  }
}
setInterval(drawFrame, 16);

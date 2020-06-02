"use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var points = [];
//var colors = [];
var normalsArray = [];

var MAZE_SIZE = 8;

var maze = [1,1,1,1,1,1,1,1,
			1,0,0,0,0,0,0,1,
			1,1,1,1,1,1,0,1,
			1,0,0,0,0,0,0,1,
			1,0,1,1,1,1,0,1,
			1,0,1,0,0,0,1,1,
			1,0,0,0,1,0,0,1,
			1,1,1,1,1,1,1,1]


// Phong 
var lightAmbient = vec4(0.9, 0.9, 0.9, 1.0 );
var lightDiffuse = vec4( 0.8, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );

var materialAmbient = vec4( 0.1, 0.1, 0.1, 1.0 );
var materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4( 0.8, 0.8, 0.8, 1.0 );
var materialShininess = 40.0;

var ambientProduct = mult(lightAmbient, materialAmbient);
var diffuseProduct = mult(lightDiffuse, materialDiffuse);
var specularProduct = mult(lightSpecular, materialSpecular);

var HeroAmbient = vec4( 0.8, 0.6, 0.6, 1.0 );
var HeroDiffuse = vec4( 1.0, 0.0, 0.0, 1.0);
var HeroSpecular = vec4( 0.8, 0.0, 0.0, 1.0 );
var HeroShininess = 90.0;

var HambientProduct = mult(lightAmbient, HeroAmbient);
var HdiffuseProduct = mult(lightDiffuse, HeroDiffuse);
var HspecularProduct = mult(lightSpecular, HeroSpecular);




// Shader transformation matrices

var pMatrix;
var mvMatrix;
var pMatrix2;
var mvMatrix2 = rotate(90,[1,0,0]);

var normalsArray = [];


var modelView_loc;
var projection_loc;
var transform_loc;
var pointlight_loc;
var normalMatrixLoc;



var near = 0.2;
var far = 300.0;
var  fovy = 60.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect;       // Viewport aspect ratio


//----------------------------------------------------------------------------
var highsee = false;
var player = vec3(1,0.25,1);
var playerheight = 0.45;
var dir = vec3(1,0,0);

var ViewLevel = 2;
var lightHeight = 0.6

//--------------------------------------
function makeCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

//____________________________________________

// Remmove when scale in MV.js supports scale matrices

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

//--------------------------------------------------


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.enable( gl.DEPTH_TEST );

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    makeCube();
    aspect =  canvas.width/canvas.height;


    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Create and initialize  buffer objects
	
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

	
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
	
    var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

 
    modelView_loc = gl.getUniformLocation( program, "modelView" );
    projection_loc = gl.getUniformLocation( program, "projection" );
    transform_loc = gl.getUniformLocation( program, "transform" );
	pointlight_loc = gl.getUniformLocation(program, "point_lightPosition")
	normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
 
   	pMatrix = perspective(fovy, aspect, near, far);
    pMatrix2 = ortho(-0.5, MAZE_SIZE-0.5, -MAZE_SIZE+0.5, 0.5, -5, 5);

	/*
	canvas.addEventListener("mousedown", function(event){
		var rect = canvas.getBoundingClientRect();
        var x = 2*(event.clientX-rect.left)/canvas.width-1;
        var y = 2*(canvas.height-(event.clientY-rect.top))/canvas.height-1;
    });
	*/
	
	window.addEventListener("keydown", function(event){
      switch(event.keyCode){
		case 37: 		//arrow left
		if(highsee){
			try_move([-1,0,0]);
			break;
		}
		  if(dir[0]==1 && dir[2]==0){
			    dir = vec3(0,0,-1);
				break;
			}
			if(dir[0]==0 && dir[2]==1){
			    dir = vec3(1,0,0);
				break;
			}
			if(dir[0]==-1 && dir[2]==0){
			    dir = vec3(0,0,1);
				break;
			}
			if(dir[0]==0 && dir[2]==-1){
			    dir = vec3(-1,0,0);
				break;
			}
		  break;
		case 39: 		//arrow right
		if(highsee){
			try_move([1,0,0]);
			break;
		}
			if(dir[0]==1 && dir[2]==0){
			    dir = vec3(0,0,1);
				break;
			}
			if(dir[0]==0 && dir[2]==1){
			    dir = vec3(-1,0,0);
				break;
			}
			if(dir[0]==-1 && dir[2]==0){
			    dir = vec3(0,0,-1);
				break;
			}
			if(dir[0]==0 && dir[2]==-1){
			    dir = vec3(1,0,0);
				break;
			}
		  break;
		case 40: 		//arrow down
		  if(highsee){
			  try_move([0,0,1]);
			  break;
		  }
		  try_move(subtract([0,0,0],dir));
		  break;
		case 38: 		//arrow up
		  if(highsee){
			  try_move([0,0,-1]);
			  break;
		  }
		  try_move(dir);
		  break;
		case 82:		//r 
		  highsee = !highsee;
		  break;
		
	  }
	});
	
	
	document.getElementById("slider1").onchange = function(event) {		//base
        ViewLevel = parseFloat( event.target.value);
    };
    document.getElementById("slider2").onchange = function(event) {		//lower arm
         lightHeight = parseFloat( event.target.value );
    };
	

	//gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(mat3()) );

	
	gl.uniform1i(gl.getUniformLocation(program, "use_pointlight"),1);

	document.getElementById("debug1").innerHTML = "arraw key to move, \"R\" to change View"; 		//debug



    render();
}

//----------------------------------------------------------------------------



//----------------------------------------------------------------------------


var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	var light_pos = vec4(player[0],lightHeight,player[2], 1);
	


	if(highsee){
		mvMatrix = mvMatrix2;
		gl.uniformMatrix4fv( modelView_loc, false, flatten(mvMatrix2) );	
		gl.uniformMatrix4fv( projection_loc, false, flatten(pMatrix2) );

	}else{
		var eye = vec3(player[0], 1.5*ViewLevel, player[2]);
		var at = add(player,dir);
		var up = vec3(0.0, 1.0, 0.0);
		eye[0] -= dir[0]*ViewLevel;
		eye[2] -= dir[2]*ViewLevel;
//document.getElementById("debug1").innerHTML = eye; 		//debug

		mvMatrix = lookAt(eye, at , up);
		gl.uniformMatrix4fv( modelView_loc, false, flatten(mvMatrix) );	
		gl.uniformMatrix4fv( projection_loc, false, flatten(pMatrix) );
	  	//gl.uniform1i(gl.getUniformLocation(program, "use_pointlight"),1);

	}

//document.getElementById("debug2").innerHTML = mvMatrix[1]; 		//debug
//document.getElementById("debug3").innerHTML = mvMatrix[2]; 		//debug

	gl.uniform4fv(pointlight_loc ,flatten(light_pos));

	
	draw_maze();
	draw_hero();
	
	
	
	
    

	
//document.getElementById("debug1").innerHTML = theta_goal[2]; 		//debug
//document.getElementById("debug2").innerHTML = theta[2]; 		//debug

	
    requestAnimFrame(render);
}


function passnormal(tMatrix){
	var modelViewMatrix = mult(mvMatrix,tMatrix);
/*	var normalM = mat3(
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
	);
/*	
	normalM = inverse(normalM);
	normalM = transpose(normalM);
*/
	var normalM = normalMatrix(modelViewMatrix,true);
	
	//var normalM = mat3();
document.getElementById("debug1").innerHTML = normalM[0]; 		//debug
document.getElementById("debug2").innerHTML = normalM[1]; 		//debug
document.getElementById("debug3").innerHTML = normalM[2]; 		//debug

	//normalMatrix = mat3();
	gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalM) );

}





function draw_maze(){
	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );	
	gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);
	
	for(var i =0;i<MAZE_SIZE;i++){
		for(var j=0;j<MAZE_SIZE;j++){
			if(maze[i*MAZE_SIZE+j]==1){
				var tMatrix = translate( j, 0.0, i );
				gl.uniformMatrix4fv( transform_loc, false, flatten(tMatrix) );
				//passnormal(tMatrix);
				gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
			}
		}
	}	
//document.getElementById("debug1").innerHTML = i; 		//debug
}



function draw_hero(){
	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(HambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(HdiffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(HspecularProduct) );	
	gl.uniform1f(gl.getUniformLocation(program, "shininess"),HeroShininess);
	
	var s = scale4(0.2, 0.2, 0.2);
	var tMatrix = mult(translate( player[0], -0.4, player[2] ), s);
	gl.uniformMatrix4fv( transform_loc, false, flatten(tMatrix) );
	gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

//document.getElementById("debug1").innerHTML = i; 		//debug
}



var vertices2 = [
    vec4(  0.0,  0.0,  1.0, 1.0 ),
    vec4(  0.0,  1.0,  1.0, 1.0 ),
    vec4(  1.0,  1.0,  1.0, 1.0 ),
    vec4(  1.0,  0.0,  1.0, 1.0 ),
    vec4(  0.0,  0.0,  0.0, 1.0 ),
    vec4(  0.0,  1.0,  0.0, 1.0 ),
    vec4(  1.0,  1.0,  0.0, 1.0 ),
    vec4(  1.0,  0.0,  0.0, 1.0 )
];

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
];

// RGBA colors
var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

function quad(  a,  b,  c,  d ) {
    //colors.push(vertexColors[a]);
    points.push(vertices[a]);
    //colors.push(vertexColors[a]);
    points.push(vertices[b]);
    //colors.push(vertexColors[a]);
    points.push(vertices[c]);
    //colors.push(vertexColors[a]);
    points.push(vertices[a]);
    //colors.push(vertexColors[a]);
    points.push(vertices[c]);
    //colors.push(vertexColors[a]);
    points.push(vertices[d]);
	var t1 = subtract(vertices[a],vertices[b]);
	var t2 = subtract(vertices[c],vertices[b]);
	var normal = vec4(normalize(cross(t2,t1)),0);
	normalsArray.push(normal);
	normalsArray.push(normal);
	normalsArray.push(normal);
	normalsArray.push(normal);
	normalsArray.push(normal);
	normalsArray.push(normal);

}


function try_move(d){
	var t = add(player, d);
	if(maze[MAZE_SIZE*t[2]+t[0]]==0){
		player = t;
	}
}




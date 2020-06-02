"use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var points = [];
var colors = [];

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


// Parameters controlling the size of the Robot's arm

var BASE_HEIGHT      = 2.0;
var BASE_WIDTH       = 5.0;
var LOWER_ARM_HEIGHT = 5.0;
var LOWER_ARM_WIDTH  = 0.5;
var UPPER_ARM_HEIGHT = 5.0;
var UPPER_ARM_WIDTH  = 0.5;

// Shader transformation matrices

var modelViewMatrix = mat4();
var projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var Base = 0;
var LowerArm = 1;
var UpperArm = 2;


var figure = [];
var stack = [];


var theta= [ 0, 0, 0]; 
var theta_goal = [0,0,0];

var angle = 0;

var modelViewMatrixLoc;

var vBuffer, cBuffer;


//for Inverse Kinematics
var red_ball = false;
var red_ball_translate = mat4();
var red_ball_NumVertices = 0;
var red_ball_pos = vec2(0,0);

//----------------------------------------------------------------------------

function quad(  a,  b,  c,  d ) {
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[b]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[d]);
}


function colorCube() {
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


function createNode(transform, render,sibling,child){
	var node = {
		transform: transform,
		render: render,
		sibling: sibling,
		child: child
	}
	return node;
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

    colorCube();
    draw_readball();
    // Load shaders and use the resulting shader program

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Create and initialize  buffer objects

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    document.getElementById("slider1").onchange = function(event) {		//base
        theta[0] = parseFloat( event.target.value);
    };
    document.getElementById("slider2").onchange = function(event) {		//lower arm
         theta[1] = parseFloat( event.target.value );
    };
    document.getElementById("slider3").onchange = function(event) {		//upper arm
         theta[2] = parseFloat( event.target.value );

    };

	canvas.addEventListener("mousedown", function(event){
		var rect = canvas.getBoundingClientRect();
		
		var x = 2*(event.clientX-rect.left)/canvas.width-1;
		var y = 2*(canvas.height-(event.clientY-rect.top))/canvas.height-1;
		red_ball = true;
		theta_goal[Base] = 0;
		document.getElementById("slider1").value = "0"; 
		red_ball_translate = translate(10*x, 10*y, 10.0, 0.0);
		red_ball_pos = vec2(10*x,10*y);
		calculate_angle();
    });
	


	
	
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );

	
	var transform = rotate(theta[Base], 0, 1, 0 );
	figure[Base] = ( createNode(transform, base,null,1) );
	
    transform = mult(translate(0.0, BASE_HEIGHT, 0.0), rotate(theta[LowerArm], 0, 0, 1 ));
	figure[LowerArm] = ( createNode(transform, lowerArm, null,2) );
	
    transform = mult(translate(0.0, LOWER_ARM_HEIGHT, 0.0), rotate(theta[UpperArm], 0, 0, 1) );
	figure[UpperArm] = ( createNode(transform, upperArm,null,null) );

    render();
}

//----------------------------------------------------------------------------


function base() {
    var s = scale4(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

//----------------------------------------------------------------------------


function upperArm() {
    var s = scale4(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    var instanceMatrix = mult(translate( 0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ),s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

//----------------------------------------------------------------------------


function lowerArm(){
    var s = scale4(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

//----------------------------------------------------------------------------


var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	if(red_ball){
		render_redball();

		for(var i=0;i<3;i++){
			if(theta[i] != theta_goal[i]){
				if(theta[i] > theta_goal[i]){theta[i]-=1;}
				else if(theta[i] < theta_goal[i]){theta[i]=theta[i]+1;}
			}
			if(Math.abs(theta[i]-theta_goal[i])<1){theta[i]=theta_goal[i];}
		}
	}
	
	//document.getElementById("slider1").value = "0"
	//document.getElementById("slider2").value = "0"
	//document.getElementById("slider3").value = "0"
	
	figure[0].transform = rotate(theta[Base], 0, 1, 0 );
	figure[1].transform = mult(translate(0.0, BASE_HEIGHT, 0.0), rotate(theta[LowerArm], 0, 0, 1 ));
	figure[2].transform = mult(translate(0.0, LOWER_ARM_HEIGHT, 0.0), rotate(theta[UpperArm], 0, 0, 1));
	
    traverse(Base);

	
document.getElementById("debug1").innerHTML = theta_goal[2]; 		//debug
document.getElementById("debug2").innerHTML = theta[2]; 		//debug

	
    requestAnimFrame(render);
}


function traverse(Id) {
    if(Id == null) return;
	
    stack.push(modelViewMatrix);
    modelViewMatrix= mult(modelViewMatrix, figure[Id].transform);
    figure[Id].render();
	
    if(figure[Id].child != null) 
        traverse(figure[Id].child); 
	
    modelViewMatrix= stack.pop();
    if(figure[Id].sibling != null) 
        traverse(figure[Id].sibling);
}

//------------------------------draw red ball
function render_redball(){
	var shearM = scale4(0.2, 0.2, 0.2);
	var redballM = mult(red_ball_translate,shearM);
	gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(redballM) );
	
    gl.drawArrays( gl.TRIANGLES, NumVertices, red_ball_NumVertices );

}
function draw_readball(){
	var va = vec4(0.0, 0.0, -1.0,1);
	var vb = vec4(0.0, 0.942809, 0.333333, 1);
	var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
	var vd = vec4(0.816497, -0.471405, 0.333333,1);
	
    tetrahedron(va, vb, vc, vd, 3);

}
function triangle(a, b, c) {

     points.push(a);
     points.push(b);
     points.push(c);
	 
	 colors.push(vec4(1.0,0.0,0.0,1.0));
	 colors.push(vec4(1.0,0.0,0.0,1.0));
	 colors.push(vec4(1.0,0.0,0.0,1.0));

     red_ball_NumVertices += 3;

}
function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}
function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

//------------------------------inverse kin

function calculate_angle(){
	var x = red_ball_pos[0];
	var y = red_ball_pos[1] - BASE_HEIGHT;;
	var d = Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
	var l1 = LOWER_ARM_HEIGHT;
	var l2 = UPPER_ARM_HEIGHT;
	if(d > l1+l2){
		d = l1+l2;
	}
	
	var cos_a = ( Math.pow(l1,2)+Math.pow(l2,2)-Math.pow(d,2) )/(2.0*l1*l2);
	var a = Math.acos(cos_a);
	var cos_c = ( Math.pow(l1,2)+Math.pow(d,2)-Math.pow(l2,2) )/(2.0*l1*d);
	var c = Math.acos(cos_c);
	var b;
	if( x>=0 && y >=0 ){
		b = Math.acos(x/d);
		theta_goal[1] = (c+b-0.5*Math.PI)*180/Math.PI;
		theta_goal[2] = (a-Math.PI)*180/Math.PI;
	}else if( x<0 && y >=0 ){
		b = Math.acos(-x/d);
		theta_goal[1] = (0.5*Math.PI-c-b)*180/Math.PI;
		theta_goal[2] = (Math.PI-a)*180/Math.PI;
	}else if( x>=0 && y <0 ){
		b = Math.acos(x/d);
		theta_goal[1] = (c-b-0.5*Math.PI)*180/Math.PI;
		theta_goal[2] = (a-Math.PI)*180/Math.PI;
	}else if( x<0 && y <0 ){
		b = Math.acos(-x/d);
		theta_goal[1] = (0.5*Math.PI-c+b)*180/Math.PI;
		theta_goal[2] = (Math.PI-a)*180/Math.PI;
	}
}


function cancel_red(){
	red_ball = false;
}


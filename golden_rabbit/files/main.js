var canvas, gl;
var program;



// about the bunny 
var vertices = get_vertices();
var indices = get_faces();
var points = [];
var numVertices;

var normalsArray = [];


var i;  // loop index


var v_position_loc;
var v_color_loc;    // location in she shader



//buffers
var index_Buffer;
var vectex_Buffer;



// mats
var mvMatrix, pMatrix;
var modelView_loc;
var projection_loc;
var transform_loc;



// for proj mat
var near = 0.2;
var far = 300.0;
var  fovy = 60.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect;       // Viewport aspect ratio


// for modelView mat
const eye = vec3(0.0, 0.0, 10);
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);


// for transform: translate, rotate
var tMatrix = mat4();

var left_down = false;  // for translate
var right_down = false; // for rotation

var translate_before_pos; // 
var trans_vec = vec3(0,0,0);
var trans_all = vec3(0.0,0.0,0.0);

var rotation_before_pos;
var rotation_axis = [0,0,0]
var rotation_angle = 0.0;

function trackballView( x,  y ) {
    var d, a;
    var v = [];

    v[0] = x;
    v[1] = y;

    d = v[0]*v[0] + v[1]*v[1];
    if (d < 1.0)
      v[2] = Math.sqrt(1.0 - d);
    else {
      v[2] = 0.0;
      a = 1.0 /  Math.sqrt(d);
      v[0] *= a;
      v[1] *= a;
    }
    return v;
}


// Phong 
var lightAmbient = vec4(0.3, 0.3, 0.3, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.8, 0.6, 0.2, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 90.0;

var ambientProduct = mult(lightAmbient, materialAmbient);
var diffuseProduct = mult(lightDiffuse, materialDiffuse);
var specularProduct = mult(lightSpecular, materialSpecular);


var spot_lightPosition = vec4(0.0,4.0,2.0,1.0); 
var spot_lightAt = vec4( 0.0, 0.0, 0.0, 0.0);
var spot_lightAt_loc;
var spot_lightAt_toLeft = false;	//true means moving to right
var spot_lightTheta = 30;
var spot_light_On = true;


var point_lightPosition = vec4(5.0, 5.0, 0.0, 1.0 );
var point_light_tMatrix = mat4();
var point_light_On = false;
var time = 0;

window.onload = function init() {



    indices_correct();  // all index minus by 1
    insect_points();

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    aspect =  canvas.width/canvas.height;

    //  init shaders
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


    // locate mat
    modelView_loc = gl.getUniformLocation( program, "modelView" );
    projection_loc = gl.getUniformLocation( program, "projection" );
    transform_loc = gl.getUniformLocation( program, "transform" );

    // drawing bunny

    // normal array
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
	
    var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );
	
    // vertex array
    vectex_Buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vectex_Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    v_position_loc = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( v_position_loc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( v_position_loc );

    // vbuffer setting done

	//light
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );	
	
	gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);
	
	
	gl.uniform4fv( gl.getUniformLocation(program, "sopt_lightPos"),flatten(spot_lightPosition));
	gl.uniform1f( gl.getUniformLocation(program, "theta"), Math.cos(spot_lightTheta) );

	spot_lightAt_loc = gl.getUniformLocation(program, "spot_lightAt");

	
	
	
	
	
	

	// Listener : mouse moving 
	
    window.addEventListener("mousedown", function(event){
		if(event.button == 0){
            var x = 2*event.clientX/canvas.width-1;
            var y = 2*(canvas.height-event.clientY)/canvas.height-1;
		    left_down = true;
			translate_before_pos = vec2(x,y);
		}
		if(event.button == 2){

			var x = 2*event.clientX/canvas.width-1;
            var y = 2*(canvas.height-event.clientY)/canvas.height-1;
			right_down = true;
			rotation_before_pos = trackballView(x,y);
			
		}
    });

    window.addEventListener("mouseup", function(event){
		if(event.button == 0){
            left_down = false;
		}
		if(event.button == 2){
			rotation_angle = 0.0;
		    right_down = false;
	    }
		
    });

    window.addEventListener("mousemove", function(event){
      if(left_down){
        var x = 2*event.clientX/canvas.width-1;
        var y = 2*(canvas.height-event.clientY)/canvas.height-1;
	    trans_vec[0] += x - translate_before_pos[0];
	    trans_vec[1] += y - translate_before_pos[1];
	    translate_before_pos = vec2(x,y);
	  }
	  if(right_down){
        var x = 2*event.clientX/canvas.width-1;
        var y = 2*(canvas.height-event.clientY)/canvas.height-1;
	    
		var rotation_current_pos = trackballView(x,y);
		var dx = rotation_current_pos[0] - rotation_before_pos[0];
		var dy = rotation_current_pos[1] - rotation_before_pos[1];
		var dz = rotation_current_pos[2] - rotation_before_pos[2];
		
		if (dx || dy || dz) {
	       rotation_angle = 20 * Math.sqrt(dx*dx + dy*dy + dz*dz);
   
	       rotation_axis[0] = rotation_before_pos[1]*rotation_current_pos[2] - rotation_before_pos[2]*rotation_current_pos[1];
	       rotation_axis[1] = rotation_before_pos[2]*rotation_current_pos[0] - rotation_before_pos[0]*rotation_current_pos[2];
	       rotation_axis[2] = rotation_before_pos[0]*rotation_current_pos[1] - rotation_before_pos[1]*rotation_current_pos[0];         
        }
		
	    //update rotation
	    rotation_before_pos = rotation_current_pos;
		rotation_axis = normalize(rotation_axis);
		tMatrix = mult( translate(-trans_all[0], -trans_all[1], -trans_all[2]), tMatrix );
		tMatrix = mult( rotate(3*rotation_angle, rotation_axis), tMatrix );
		tMatrix = mult( translate(trans_all[0], trans_all[1], trans_all[2]), tMatrix );

	  }
	  
    } );
	
	window.addEventListener("wheel", function(event){
		if(event.delta.Y < 0){	// wheel up
			trans_vec[2] += 1;
		}
		if(event.delta.Y > 0){	// wheel down
			trans_vec[2] -= 1;
		}
		
	});

	// listener: key
    window.addEventListener("keydown", function(event){
      switch(event.keyCode){
		case 38: 		//arrow up
          trans_vec[2] += 1;
		  break;
		case 40: 		//arrow up
          trans_vec[2] -= 1;
		  break;
		case 82:		//r 
		  tMatrix = mat4();
		  point_light_tMatrix = mat4();
		  trans_all = vec3(0.0,0.0,0.0);
		  break;
		case 80:		//p
		  point_light_On = !point_light_On;
		  break;
		case 83:		//s
		  spot_light_On = !spot_light_On;
	  }
	});
  



    render();
};

function render() {


      gl.clear( gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);


      // projection marix and modelview matrix
      mvMatrix = lookAt(eye, at , up);
      pMatrix = perspective(fovy, aspect, near, far);
	  
	  //update translate
      tMatrix = mult( translate(trans_vec[0], trans_vec[1], trans_vec[2]), tMatrix );
	  point_light_tMatrix = mult(translate(trans_vec[0], trans_vec[1], trans_vec[2]),point_light_tMatrix)
	  //point light
	  point_light_tMatrix = mult(rotate(1, [0,1,0]) , point_light_tMatrix );
	 
	  trans_all[0] += trans_vec[0];
  	  trans_all[1] += trans_vec[1];
	  trans_all[2] += trans_vec[2];

   	  trans_vec = vec3(0,0,0);
//document.getElementById("debug").innerHTML = trans_all; 		//debug

	 
	  if(point_light_On){
		  	gl.uniform1i(gl.getUniformLocation(program, "use_pointlight"),1);
	  }
	  else{
		  gl.uniform1i(gl.getUniformLocation(program, "use_pointlight"),0);
	  }
	  if(spot_light_On){
		  	gl.uniform1i(gl.getUniformLocation(program, "use_spotlight"),1);
	  }
	  else{
		  gl.uniform1i(gl.getUniformLocation(program, "use_spotlight"),0);
	  }
	  
	  if(spot_lightAt_toLeft){
		  spot_lightAt[0]-= 0.1;
		  if(spot_lightAt[0] < -25.0){spot_lightAt_toLeft=false;}
	  }else{
		  spot_lightAt[0]+= 0.1;
		  if(spot_lightAt[0] > 20.0){spot_lightAt_toLeft=true;}
	  }

//document.getElementById("debug").innerHTML = spot_lightAt; 		//debug

	  // assigning uniforms
      gl.uniformMatrix4fv( gl.getUniformLocation( program, "point_light_tMatrix" ), false, flatten(point_light_tMatrix) );
	  gl.uniformMatrix4fv( transform_loc, false, flatten(tMatrix));
      gl.uniformMatrix4fv( modelView_loc, false, flatten(mvMatrix) );
      gl.uniformMatrix4fv( projection_loc, false, flatten(pMatrix) );
	  
      gl.uniform4fv( gl.getUniformLocation(program, "point_lightPosition"),flatten(point_lightPosition));
      
	  gl.uniform4fv( spot_lightAt_loc,flatten(spot_lightAt));
	  
      gl.drawArrays( gl.TRIANGLES, 0, numVertices );


	  //time += 1;
	  
	  
  requestAnimFrame(render);
}


function indices_correct(){

  for(i = 0; i < indices.length; i++){
    indices[i][0]--;
    indices[i][1]--;
    indices[i][2]--;
  }
}




function insect_points(){
	for(i=0;i<indices.length;i++){
		points.push(vec4(vertices[indices[i][0]]));
		points.push(vec4(vertices[indices[i][1]]));
		points.push(vec4(vertices[indices[i][2]]));
		
		var a = vertices[indices[i][0]];
		var b = vertices[indices[i][1]];
		var c = vertices[indices[i][2]];
		
		var t1 = subtract(vec4(vertices[indices[i][2]]),vec4(vertices[indices[i][1]]));
		var t2 = subtract(vec4(vertices[indices[i][0]]),vec4(vertices[indices[i][1]]));
		var normal = normalize(cross(t1,t2));
		
		
		normalsArray.push(normal);
		normalsArray.push(normal);
		normalsArray.push(normal);
		
/*		
        normal = vec3(normal);
		var temp = vec3(a[0]+normal[0],a[1]+normal[1],a[2]+normal[2])
		normalsArray.push(temp);
		var temp = vec3(b[0]+normal[0],b[1]+normal[1],b[2]+normal[2])
		normalsArray.push(temp);
		var temp = vec3(c[0]+normal[0],c[1]+normal[1],c[2]+normal[2])
		normalsArray.push(temp);
*/
	}
	numVertices = points.length;
}












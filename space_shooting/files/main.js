
var canvas;
var gl;

var i;
var j;		//index in loop

var cannon_half_size = 0.05;



// Aliens Vertices        

var aliens1_vertices = [
  vec2(-0.95, 1.0),	//0
  vec2(-0.75, 1.0),	//1
  vec2(-0.95, 0.8),	//2
  vec2(-0.75, 1.0),	//1
  vec2(-0.95, 0.8),	//2
  vec2(-0.75, 0.8),	//3

  vec2(-0.25, 1.0),
  vec2(-0.05, 1.0),
  vec2(-0.25, 0.8),
  vec2(-0.05, 1.0),
  vec2(-0.25, 0.8),
  vec2(-0.05, 0.8),

  vec2(0.05, 1.0),
  vec2(0.25, 1.0),
  vec2(0.05, 0.8),
  vec2(0.25, 1.0),
  vec2(0.05, 0.8),
  vec2(0.25, 0.8),

  vec2(0.75, 1.0),
  vec2(0.95, 1.0),
  vec2(0.75, 0.8),
  vec2(0.95, 1.0),
  vec2(0.75, 0.8),
  vec2(0.95, 0.8)
];

var aliens2_vertices = [
  vec2(-0.65, 0.75),
  vec2(-0.45, 0.75),
  vec2(-0.65, 0.55),
  vec2(-0.45, 0.75),
  vec2(-0.65, 0.55),
  vec2(-0.45, 0.55),

  vec2(-0.4, 0.75),
  vec2(-0.2, 0.75),
  vec2(-0.4, 0.55),
  vec2(-0.2, 0.75),
  vec2(-0.4, 0.55),
  vec2(-0.2, 0.55),

  vec2(0.1, 0.75),
  vec2(0.3, 0.75),
  vec2(0.1, 0.55),
  vec2(0.3, 0.75),
  vec2(0.1, 0.55),
  vec2(0.3, 0.55),

  vec2(0.6, 0.75),
  vec2(0.8, 0.75),
  vec2(0.6, 0.55),
  vec2(0.8, 0.75),
  vec2(0.6, 0.55),
  vec2(0.8, 0.55)
];

// cannon vertices
var cannon_vertices = [

  vec2(-cannon_half_size, -1+(2 * cannon_half_size)),
  vec2(-cannon_half_size, -1),
  vec2( cannon_half_size, -1),
  vec2( cannon_half_size, -1+(2 * cannon_half_size)),
  vec2(-cannon_half_size, -1+(2 * cannon_half_size)),
  vec2( cannon_half_size, -1)

];



var program_aliens;
var program_cannon;
var program_cbullet;
var program_abullet;

var aliens1_Buffer;
var aliens2_Buffer;
var cannon_Buffer;
var abullet_Buffer;
var cbullet_Buffer;

var cannon_vPosition;
var aliens_vPosition;
var abullet_vposition;
var cbullet_vposition;

var aliens_depth_speed = -0.001;
var aliens_move_speed;
var connon_move_speed = 0.02;
var abullet_move_speed = 0.01;
var cbullet_move_speed = 0.03;

var aliens_h_offset_Loc;
var aliens1_h_offset = [0,0,0,0];
var aliens2_h_offset = [0,0,0,0];
var aliens_depth_Loc;
var aliens_depth = 0;
var cannon_offset_Loc;
var cannon_offset = 0;


var alien_bullet_vetices = [];
var cannon_bullet_vetices = [];
var cbullet_v_offset_Loc;
var abullet_v_offset_Loc;
var cbullet_v_offset = [];
var abullet_v_offset = [];

var aliens1_dir = [1,1,1,1];
var aliens2_dir = [-1,-1,-1,-1];
var cannon_dir = 0;


var win = false;
var lose = false;
var quit = false;
var restart = false;

var win_time = 0;
var alien_shoot_time = 10;
var alien_shoot_rate = 120;

var cannon_shoot_flag = false;


//listener
window.addEventListener("keydown",keydown,false);
window.addEventListener("keyup",keyup,false);
window.addEventListener("click",click,false);
function keydown(key){
  switch(key.keyCode){
    case 37:			//arrow left
      cannon_dir = -1;
      break;
    case 65:			//arrow left
      cannon_dir = -1;
      break;
    case 39:			//arrow right
      cannon_dir = 1;
      break;
    case 68:			//arrow right
      cannon_dir = 1;
      break;
    case 81:			//q
      quit = true;
      break;
    case 82:			//r
      restart = true;
      break;
  }
}
function keyup(key){
  switch(key.keyCode){
    case 37:			//arrow left
      cannon_dir = 0;
      break;
    case 39:			//arrow right
      cannon_dir = 0;
      break;
    case 65:			//arrow right
      cannon_dir = 0;
      break;
    case 68:			//arrow right
      cannon_dir = 0;
      break;
  }
}
function click(){
        cannon_shoot();
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );


    gl.clear( gl.COLOR_BUFFER_BIT ); /////////////
    
    //  init shaders
    
    program_aliens = initShaders( gl, "vertex-shader-alien", "fragment-shader-red" );
    program_cannon = initShaders( gl, "vertex-shader-cannon", "fragment-shader-green" );
    program_cbullet = initShaders( gl, "vertex-shader-bullet", "fragment-shader-green" );
    program_abullet = initShaders( gl, "vertex-shader-bullet", "fragment-shader-red" );

   // init bullets

   gl.useProgram( program_cbullet );
   cbullet_Buffer = gl.createBuffer();
   cbullet_vposition = gl.getAttribLocation( program_cbullet, "vPosition" );
   cbullet_v_offset_Loc = gl.getUniformLocation( program_cbullet, "v_offset" );

   gl.useProgram( program_abullet );
   abullet_Buffer = gl.createBuffer();
   abullet_vposition = gl.getAttribLocation( program_abullet, "vPosition" );
   abullet_v_offset_Loc = gl.getUniformLocation( program_abullet, "v_offset" );


   // aliens 
    gl.useProgram( program_aliens );

    aliens_vPosition = gl.getAttribLocation( program_aliens, "vPosition" );
    aliens_h_offset_Loc = gl.getUniformLocation( program_aliens, "h_offset" );
    aliens_depth_Loc = gl.getUniformLocation( program_aliens, "depth" );
    gl.uniform1f(aliens_h_offset_Loc, 0);      ///
    gl.uniform1f(aliens_depth_Loc, aliens_depth);

   // aliens1
    aliens1_Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, aliens1_Buffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(aliens1_vertices), gl.STATIC_DRAW );

      gl.vertexAttribPointer( aliens_vPosition, 2, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( aliens_vPosition );    
      gl.drawArrays( gl.TRIANGLES, 0, aliens1_vertices.length );
    
    // aliens 2
    aliens2_Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, aliens2_Buffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(aliens2_vertices), gl.STATIC_DRAW );

      gl.vertexAttribPointer( aliens_vPosition, 2, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( aliens_vPosition );    
      gl.drawArrays( gl.TRIANGLES, 0, aliens2_vertices.length );
  

    //cannon
    gl.useProgram( program_cannon );
    cannon_offset_Loc = gl.getUniformLocation( program_cannon, "offset" );
    gl.uniform1f(cannon_offset_Loc, cannon_offset);      ///

    cannon_Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cannon_Buffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cannon_vertices), gl.STATIC_DRAW );
      cannon_vPosition = gl.getAttribLocation( program_cannon, "vPosition" );
      gl.vertexAttribPointer( cannon_vPosition, 2, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( cannon_vPosition );    
      gl.drawArrays( gl.TRIANGLES, 0, cannon_vertices.length );
  


    alert("HELP:\nLeft-Click to shoot\nArrow keys to move left or right\nGoal: Defeat all red blocks\n\nIf you win, red's block will be faster\n\n\'r\' to restart the game\n\'q\' to shut the game");

    document.getElementById("shoot_rate_slider").onchange = function(event) {		//base
        alien_shoot_rate = parseFloat( event.target.value);
    };
    document.getElementById("forward_speed_slider").onchange = function(event) {		//base
        aliens_depth_speed = -parseFloat( event.target.value);
    };

    render();
};

function render() {
//document.getElementById("debug").innerHTML = i;			//debug

      gl.clear( gl.COLOR_BUFFER_BIT );
      
      bullet_hits();

      //alien time
      alien_depth_move();
      alien_hori_move();
      //draw alien1
      gl.useProgram( program_aliens );

      for(i =0; i*6 < aliens1_vertices.length; i++){
        gl.uniform1f(aliens_h_offset_Loc, aliens1_h_offset[i]);      ///
        gl.uniform1f(aliens_depth_Loc, aliens_depth);

        gl.bindBuffer(gl.ARRAY_BUFFER, aliens1_Buffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(aliens1_vertices), gl.STATIC_DRAW );
        gl.vertexAttribPointer( aliens_vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( aliens_vPosition );    
        gl.drawArrays( gl.TRIANGLES, (i*6), 6 );
      }   
      
      //draw alien2

      for(i =0; i*6 < aliens2_vertices.length; i++){
        gl.uniform1f(aliens_h_offset_Loc, aliens2_h_offset[i]);      ///
        gl.uniform1f(aliens_depth_Loc, aliens_depth);

        gl.bindBuffer(gl.ARRAY_BUFFER, aliens2_Buffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(aliens2_vertices), gl.STATIC_DRAW );
        gl.vertexAttribPointer( aliens_vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( aliens_vPosition );    
        gl.drawArrays( gl.TRIANGLES, (i*6), 6 );
      }

      if( alien_shoot_time <= 0){
        alien_shoot();
        alien_shoot_time = alien_shoot_rate;
      }else{
        alien_shoot_time--;
      }



      //cannon time
      cannon_move();
      //draw cannon;
      gl.useProgram( program_cannon );
      gl.uniform1f(cannon_offset_Loc, cannon_offset); 
      gl.bindBuffer(gl.ARRAY_BUFFER, cannon_Buffer);
      gl.vertexAttribPointer( cannon_vPosition, 2, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( cannon_vPosition );    
      gl.drawArrays( gl.TRIANGLES, 0, cannon_vertices.length );


      //cannon shoot by click
      if(cannon_shoot_flag){
        cannon_shoot();
        cannon_shoot_flag = false;
      }

      bullet_move(); 

      //draw alien bullets

      for(i = 0; i*3 < alien_bullet_vetices.length; i++){

        gl.useProgram(program_abullet); 
        gl.uniform1f(abullet_v_offset_Loc, abullet_v_offset[i]);      ///
        gl.bindBuffer(gl.ARRAY_BUFFER, abullet_Buffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(alien_bullet_vetices), gl.STATIC_DRAW );
        gl.vertexAttribPointer( abullet_vposition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( abullet_vposition );    
        gl.drawArrays( gl.TRIANGLES, (i*3), 3 );
      }

      // draw cannon bullets

      for(i = 0; i < cbullet_v_offset.length; i++){

        gl.useProgram(program_cbullet); 
        gl.uniform1f(cbullet_v_offset_Loc, cbullet_v_offset[i]);      ///
        gl.bindBuffer(gl.ARRAY_BUFFER, cbullet_Buffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(cannon_bullet_vetices), gl.STATIC_DRAW );
        gl.vertexAttribPointer( cbullet_vposition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( cbullet_vposition );    
        gl.drawArrays( gl.TRIANGLES, (i*3), 3 );

      }


  if((aliens2_vertices.length + aliens1_vertices.length) == 0)
    {win = true;}

      
    
  if(win){game_win();}
  if(lose){game_lose();}
  if(quit){
    alert("the game will be shutted..");
    gl.clear( gl.COLOR_BUFFER_BIT );
    document.getElementById("debug").innerHTML = "quit";
    return;
  }
  if(restart){game_restart();}


  window.requestAnimFrame(render);
}




function game_win(){

  alert("Congrulations.\n WIN.\nnext time, the alien speed will be faster.");
  win_time++;
  game_restart();
  win = false;
}


function game_lose(){

  cannon_vertices = [];
  aliens_depth_speed = 0;
  if(win_time!=0){
    alert("you lose, but it's ok.\nnext time, the alien speed will be slower.");
    win_time--;
  }else{
    alert("LOSE, don't worry, just try again.\n");
  }
  game_restart();
}



function alien_shoot(){

  if(alien2_all_die()){

    for(i =0; i < aliens1_h_offset.length; i++){		//alien1 shoot
      var bullet_pos1 = vec2(
                             aliens1_vertices[i*6][0] + aliens1_h_offset[i] + 0.1 ,
                             aliens1_vertices[i*6+2][1] + aliens_depth
                           );
      var bullet_pos2 = vec2(bullet_pos1[0]-0.03,bullet_pos1[1]+0.07);
      var bullet_pos3 = vec2(bullet_pos1[0]+0.03,bullet_pos1[1]+0.07);
      alien_bullet_vetices.push(bullet_pos1,bullet_pos2,bullet_pos3);
      abullet_v_offset.push(0);
    }

    }else{

      for(i =0; i < aliens2_h_offset.length; i++){		//alien2 shoot
        var bullet_pos1 = vec2(
                                aliens2_vertices[i*6][0] + aliens2_h_offset[i] + 0.1,
                                aliens2_vertices[i*6+2][1] + aliens_depth);

        var bullet_pos2 = vec2(bullet_pos1[0]-0.03,bullet_pos1[1]+0.07);
        var bullet_pos3 = vec2(bullet_pos1[0]+0.03,bullet_pos1[1]+0.07);
        alien_bullet_vetices.push(bullet_pos1,bullet_pos2,bullet_pos3);
        abullet_v_offset.push(0);

      }

    }
}




function cannon_shoot(){

  var bullet_pos1 = vec2(
                         cannon_vertices[0][0] + cannon_offset +  cannon_half_size ,
                         cannon_vertices[0][1] 
                        );
  var bullet_pos2 = vec2(bullet_pos1[0]+0.03,bullet_pos1[1]-0.07);
  var bullet_pos3 = vec2(bullet_pos1[0]-0.03,bullet_pos1[1]-0.07);
  cannon_bullet_vetices.push(bullet_pos1,bullet_pos2,bullet_pos3);
  cbullet_v_offset.push(0);



}











function cannon_move(){
  cannon_offset = cannon_offset + cannon_dir * connon_move_speed;
  if(cannon_offset > (1-cannon_half_size)){cannon_offset = (1-cannon_half_size);}
  if(cannon_offset < -(1-cannon_half_size)){cannon_offset = -(1-cannon_half_size);}
}






function alien_depth_move(){
  aliens_depth = aliens_depth + aliens_depth_speed;
  if(alien2_all_die()){
    if(aliens_depth <= -2+(2*cannon_half_size)+0.2){
      lose = true;
    }
  }else{
    if(aliens_depth <= -2+(2*cannon_half_size)+0.45){
      lose = true;
    }
  }
}








function alien_hori_move(){

  aliens_move_speed =  0.002- (aliens_depth / 100);

  for(i =0; i < aliens1_h_offset.length; i++){

    var left_edge = aliens1_vertices[i*6][0] + aliens1_h_offset[i];
    var right_edge = aliens1_vertices[i*6+1][0] + aliens1_h_offset[i];
    var left;		//the left alien or edge of screen
    var right;		//the right alien or edge of screen
    if(i == 0){left = -1;}
    else{left = aliens1_vertices[(i-1)*6+1][0] + aliens1_h_offset[i-1];}
    if(i == aliens1_h_offset.length-1){right = 1;}
    else{right = aliens1_vertices[(i+1)*6][0] + aliens1_h_offset[i+1];}
    
    if(left_edge < left){
      aliens1_dir[i] = 1;
    }else if(right_edge > right){
      aliens1_dir[i] =-1;
    }else{
      if(Math.random() > 0.9){aliens1_dir[i] = aliens1_dir[i];}	//0.9 proability to change direction
    }
  }

  for(i=0;i < aliens1_h_offset.length; i++){
    aliens1_h_offset[i] = aliens1_h_offset[i] + aliens1_dir[i] * aliens_move_speed;
  }

   for(i =0; i < aliens2_h_offset.length; i++){

    var left_edge = aliens2_vertices[i*6][0] + aliens2_h_offset[i];
    var right_edge = aliens2_vertices[i*6+1][0] + aliens2_h_offset[i];
    var left;		//the left alien or edge of screen
    var right;		//the right alien or edge of screen
    if(i == 0){left = -1;}
    else{left = aliens2_vertices[(i-1)*6+1][0] + aliens2_h_offset[i-1];}
    if(i == aliens2_h_offset.length-1){right = 1;}
    else{right = aliens2_vertices[(i+1)*6][0] + aliens2_h_offset[i+1];}
    
    if(left_edge < left){
      aliens2_dir[i] = 1;
    }else if(right_edge > right){
      aliens2_dir[i] =-1;
    }else{
      if(Math.random() > 0.9){aliens2_dir[i] = aliens2_dir[i];}	//0.9 proability to change direction
    }
  }

  for(i=0;i < aliens2_h_offset.length; i++){
    aliens2_h_offset[i] = aliens2_h_offset[i] + aliens2_dir[i] * aliens_move_speed;
  }

}







function bullet_move(){

  var bullet_out_screen = 0;	//bullets that moving out of screen, to be deleted

  for(i=0;i < abullet_v_offset.length;i++){
    abullet_v_offset[i] -= abullet_move_speed;
    if(abullet_v_offset[i]+alien_bullet_vetices[3*i][1] < -1){
      bullet_out_screen++;
    }
  }

  for(i=0; i < bullet_out_screen; i++){
    abullet_v_offset.splice(0,1);
    alien_bullet_vetices.shift();
    alien_bullet_vetices.shift();
    alien_bullet_vetices.shift();
  }

  bullet_out_screen = 0;	//cannon bullets to be deleted

  for(i=0;i < cbullet_v_offset.length;i++){
    cbullet_v_offset[i] += cbullet_move_speed;
    if(cbullet_v_offset[i]+cannon_bullet_vetices[3*i][1] > 1){
      bullet_out_screen++;
    }
  }

  for(i=0; i < bullet_out_screen; i++){
    cbullet_v_offset.splice(0,1);
    cannon_bullet_vetices.shift();
    cannon_bullet_vetices.shift();
    cannon_bullet_vetices.shift();
  }

}







function bullet_hits(){
  
  for(i=0;i < abullet_v_offset.length;i++){
    if(abullet_v_offset[i]+alien_bullet_vetices[3*i][1] < -1+(2*cannon_half_size) &&
       alien_bullet_vetices[3*i][0] <= cannon_vertices[2][0]+cannon_offset &&
       alien_bullet_vetices[3*i][0] >= cannon_vertices[0][0]+cannon_offset)
         {lose = true;}
    
  }

  var bullet_hited = [];
  var aliens1_dead = [];
  var aliens2_dead = [];

  for(i=0;i < cbullet_v_offset.length;i++){
    for(j =0; j < aliens1_h_offset.length; j++){
      var left = aliens1_vertices[6*j][0] + aliens1_h_offset[j];
      var up   = aliens1_vertices[6*j][1] + aliens_depth;
      var right= aliens1_vertices[6*j+1][0] + aliens1_h_offset[j];
      var down = aliens1_vertices[6*j+2][1] + aliens_depth;
      var bullet_x = cannon_bullet_vetices[3*i][0];
      var bullet_y = cannon_bullet_vetices[3*i][1] + cbullet_v_offset[i];
 
      if(left<=bullet_x && right>=bullet_x && up>=bullet_y && down<=bullet_y){
        bullet_hited.push(i);
        aliens1_dead.push(j);
      }

    }
    for(j =0; j < aliens2_h_offset.length; j++){
      var left = aliens2_vertices[6*j][0] + aliens2_h_offset[j];
      var up   = aliens2_vertices[6*j][1] + aliens_depth;
      var right= aliens2_vertices[6*j+1][0] + aliens2_h_offset[j];
      var down = aliens2_vertices[6*j+2][1] + aliens_depth;
      var bullet_x = cannon_bullet_vetices[3*i][0];
      var bullet_y = cannon_bullet_vetices[3*i][1] + cbullet_v_offset[i];
 
      if(left<=bullet_x && right>=bullet_x && up>=bullet_y && down<=bullet_y){
        bullet_hited.push(i);
        aliens2_dead.push(j);
      }
    }
  }

  for(i=0; i<bullet_hited.length;i++){
    cbullet_v_offset.splice(bullet_hited[i],1);
    cannon_bullet_vetices.splice(bullet_hited[i]*3,3);
  }

  for(i=0; i<aliens1_dead.length;i++){
    aliens1_h_offset.splice(aliens1_dead[i],1);
    aliens1_vertices.splice(aliens1_dead[i]*6,6);
    document.getElementById("debug").innerHTML = "Nice one.";
  }

  for(i=0; i<aliens2_dead.length;i++){
    aliens2_h_offset.splice(aliens2_dead[i],1);
    aliens2_vertices.splice(aliens2_dead[i]*6,6);
    document.getElementById("debug").innerHTML = "Good hit.";
  }

}







function alien2_all_die(){
  return (aliens2_vertices.length == 0);
}











function game_restart(){

document.getElementById("debug").innerHTML = "Level "+ win_time;

//reset vars
aliens1_vertices = [
  vec2(-0.95, 1.0),	//0
  vec2(-0.75, 1.0),	//1
  vec2(-0.95, 0.8),	//2
  vec2(-0.75, 1.0),	//1
  vec2(-0.95, 0.8),	//2
  vec2(-0.75, 0.8),	//3

  vec2(-0.25, 1.0),
  vec2(-0.05, 1.0),
  vec2(-0.25, 0.8),
  vec2(-0.05, 1.0),
  vec2(-0.25, 0.8),
  vec2(-0.05, 0.8),

  vec2(0.05, 1.0),
  vec2(0.25, 1.0),
  vec2(0.05, 0.8),
  vec2(0.25, 1.0),
  vec2(0.05, 0.8),
  vec2(0.25, 0.8),

  vec2(0.75, 1.0),
  vec2(0.95, 1.0),
  vec2(0.75, 0.8),
  vec2(0.95, 1.0),
  vec2(0.75, 0.8),
  vec2(0.95, 0.8)
];

aliens2_vertices = [
  vec2(-0.65, 0.75),
  vec2(-0.45, 0.75),
  vec2(-0.65, 0.55),
  vec2(-0.45, 0.75),
  vec2(-0.65, 0.55),
  vec2(-0.45, 0.55),

  vec2(-0.4, 0.75),
  vec2(-0.2, 0.75),
  vec2(-0.4, 0.55),
  vec2(-0.2, 0.75),
  vec2(-0.4, 0.55),
  vec2(-0.2, 0.55),

  vec2(0.1, 0.75),
  vec2(0.3, 0.75),
  vec2(0.1, 0.55),
  vec2(0.3, 0.75),
  vec2(0.1, 0.55),
  vec2(0.3, 0.55),

  vec2(0.6, 0.75),
  vec2(0.8, 0.75),
  vec2(0.6, 0.55),
  vec2(0.8, 0.75),
  vec2(0.6, 0.55),
  vec2(0.8, 0.55)
];

// cannon vertices
cannon_vertices = [

  vec2(-cannon_half_size, -1+(2 * cannon_half_size)),
  vec2(-cannon_half_size, -1),
  vec2( cannon_half_size, -1),
  vec2( cannon_half_size, -1+(2 * cannon_half_size)),
  vec2(-cannon_half_size, -1+(2 * cannon_half_size)),
  vec2( cannon_half_size, -1)

];

 aliens_depth_speed = -parseFloat(document.getElementById("forward_speed_slider").value)*(win_time+1);

 connon_move_speed = 0.02;
 abullet_move_speed = 0.01;
 cbullet_move_speed = 0.05;


 aliens1_h_offset = [0,0,0,0];
 aliens2_h_offset = [0,0,0,0];
 aliens_depth = 0;
 cannon_offset = 0;


 alien_bullet_vetices = [];
 cannon_bullet_vetices = [];
 cbullet_v_offset_Loc;
 abullet_v_offset_Loc;
 cbullet_v_offset = [];
 abullet_v_offset = [];

 aliens1_dir = [1,1,1,1];
 aliens2_dir = [-1,-1,-1,-1];
 cannon_dir = 0;


 win = false;
 lose = false;
 quit = false;
 restart = false;


 alien_shoot_time = 10;

 cannon_shoot_flag = false;

//reset end
}










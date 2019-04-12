// Extend Touch.__proto__
window.Touch.prototype.getForce = function() {
  return this.isPen() ? this.force:.5;
};
window.Touch.prototype.isPen = function() {
  const hasForce = !(this.force==null);
  const isIOS = navigator.userAgent.match(/iPhone|iPad/);
  const isStylus = this.radiusX===.5 && this.radiusY===.5;
  return (hasForce && (isIOS || isStylus));
};
window.Touch.prototype.getPosition = function() {
  const target_position = this.target.getBoundingClientRect();
  return {
    targetX: this.clientX - target_position.left + window.pageXOffset,
    targetY: this.clientY - target_position.top + window.pageYOffset,
    clientX: this.clientX,
    clientY: this.clientY
  };
};


const _SVG_NAMESPACE = "http://www.w3.org/2000/svg";


// Define DrawArea class
const DrawArea = class {
  constructor(parent) {
    /* Prepare Parent Element */
    parent = parent || document.body;
    /* Prepare SVG Element */
    const parent_style = window.getComputedStyle(parent);
    const container = document.createElementNS(_SVG_NAMESPACE,"svg");
    const container_width = Math.floor(Number(parent_style.width.slice(0,-2)));
    const container_height = Math.floor(Number(parent_style.height.slice(0,-2)));

    container.setAttribute("width", `${container_width}px`);
    container.setAttribute("height", `${container_height}px`);
    container.setAttribute("viewBox", `0,0,${container_width},${container_height}`);
    parent.appendChild(container);

    this.class = "DrawArea";
    this.parent = parent;
    this.container = container;
    this.lines = new Array();
  }

  addEventListener(eventName,callback) {
    this.container.addEventListener(eventName,function(e) {
      e.preventDefault();
      callback(e);
    }.bind(this));
    return this;
  }
  onTouchStart(callback) {return this.addEventListener("touchstart",callback);}
  onTouchMove(callback) {return this.addEventListener("touchmove",callback);}
  onTouchEnd(callback) {return this.addEventListener("touchend",callback);}

  createPoint(x, y) {
    return new Point(this.container, x, y);
  }

  createLine(options) {
    const line = new Line(this.container, options);
    this.lines.push(line);
    return line;
  }
}

// Define Point class
const Point = class {
  constructor(container, x, y) {
    this.container = container;
    this.class = "Point";
    this.positionX = x||0;
    this.positionY = y||0;
  }

  draw(option) {
    const opt = ((typeof option==="object")&&!Array.isArray(option)) ? option:{};
    const circle = document.createElementNS(_SVG_NAMESPACE, opt.shape||"circle");
    circle.setAttribute("cx", this.positionX);
    circle.setAttribute("cy", this.positionY);
    circle.setAttribute("r", opt.radius||1.5);
    circle.setAttribute("stroke", opt.stroke||"transparent");
    circle.setAttribute("fill", opt.fill||"#000000");
    //console.log(`x: ${x}\ny: ${y}`);
    this.container.appendChild(circle);
  }
}


// Define Line class
const Line = class {
  constructor(container, options) {
    options = options || {};

    const path = document.createElementNS(_SVG_NAMESPACE,"path");
    const path_line = document.createElementNS(_SVG_NAMESPACE,"path");
    path_line.setAttribute("stroke","#000000"/*"transparent"*/);
    path_line.setAttribute("fill","transparent");

    this.class = "Line";
    this.points = new Array();
    this.path = path;
    this.pathLine = path_line;
    this.strokeWidth = options.strokeWidth||1;
    this.isDrawn = false;
    this.container = container;
    this.vertex = new Array();
  }

  draw(options) {
    if(this.isDrawn) return this;

    options = options || {};
    this.path.setAttribute("stroke", options.stroke||"#00ff00");
    this.path.setAttribute("fill", options.fill||"#000000");
    this.path.setAttribute("stroke-linecap", options.strokeLinecap||"round");
    this.path.setAttribute("stroke-linejoint", options.strokeLinejoint||"round");

    let path_line_d = "";
    for(let i=0; i<this.points.length; i++) {
      const current_point = this.points[i];
      if(i===0) path_line_d = `M${current_point.x},${current_point.y}`;
      else {
        const prev_point = this.points[i-1];
        path_line_d += ` l${current_point.x-prev_point.x},${current_point.y-prev_point.y}`;
      }
    }

    this.pathLine.setAttribute("d",path_line_d);

    this.container.appendChild(this.path);
    this.container.appendChild(this.pathLine);
    this.isDrawn = true;
    return this;
  }

  addPoint(x, y, force) {
    this.points.push({
      x: x,
      y: y,
      force: force||.5
    });
    if(!this.isDrawn) return this;
    /*
    const stroke_width = this.strokeWidth;

    const calcStartWing = (curr,next)=>{
      const denominator = Math.sqrt(Math.pow(next.x-curr.x,2)+Math.pow(next.y-curr.y,2));
      const wingX = stroke_width*curr.force*(next.y-curr.y)/denominator;
      const wingY = stroke_width*curr.force*(next.x-curr.x)/denominator;

      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      let signLeftX = 1;
      let signLeftY = 1;
      if(dx>=0&&dy>=0) signLeftY = -1;
      else if(dx>=0&&dy<0) signLeftX = signLeftY = -1;
      //else if(dx<0&&dy>=0) {}
      else if(dx<0&&dy<0) signLeftX = -1;

      return {
        left: {
          x: curr.x + signLeftX*wingX,
          y: curr.y + signLeftY*wingY
        },
        right: {
          x: curr.x - signLeftX*wingX,
          y: curr.y - signLeftY*wingY
        }
      };
    };
    const calcEndWing = (prev,curr)=>{
      const denominator = Math.sqrt(Math.pow(curr.x-prev.x,2)+Math.pow(curr.y-prev.y,2));
      const wingX = stroke_width*curr.force*(curr.y-prev.y)/denominator
      const wingY = stroke_width*curr.force*(curr.x-prev.x)/denominator

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      let signLeftX = 1;
      let signLeftY = 1;
      if(dx>=0&&dy>=0) signLeftY = -1;
      else if(dx>=0&&dy<0) signLeftX = signLeftY = -1;
      //else if(dx<0&&dy>=0) {}
      else if(dx<0&&dy<0) signLeftX = -1;

      return {
        left: {
          x: curr.x + signLeftX*wingX,
          y: curr.y + signLeftY*wingY
        },
        right: {
          x: curr.x - signLeftX*wingX,
          y: curr.y - signLeftY*wingY
        }
      };
    }
    const calcWing = (prev,curr,next)=>{
      const adx = curr.x - prev.x;
      const ady = curr.y - prev.y;
      const bdx = next.x - curr.x;
      const bdy = next.y - curr.y;
      if(Math.floor(adx)===Math.floor(bdx) && Math.floor(ady)===Math.floor(bdy)) return calcEndWing(prev,curr);

      const dedx = next.x - prev.x;
      const dedy = next.y - prev.y;

      const a = Math.sqrt(Math.pow(curr.x-prev.x,2)+Math.pow(curr.y-prev.y,2));
      const b = Math.sqrt(Math.pow(next.x-curr.x,2)+Math.pow(next.y-curr.y,2));
      const de = Math.sqrt(Math.pow(next.x-prev.x,2)+Math.pow(next.y-prev.y,2));
      const d = de*a/(a+b);
      const e = de*b/(a+b);
      const f = Math.sqrt(a*b-d*e);

      const division_denominator = (Math.pow(dedx,2)+Math.pow(dedy,2));
      const divided_real = (adx*dedx + ady*dedy) / division_denominator;
      const dividex_imag = (dedx*ady + dedy*adx) / division_denominator;

      const wingX = ((curr.x + (next.x-prev.x)*a/(a+b)) - curr.x) * stroke_width*curr.force/f;
      const wingY = ((curr.y + (next.y-prev.y)*a/(a+b)) - curr.y) * stroke_width*curr.force/f;

      let signLeftX = 1;
      let signLeftY = 1;

      if(dividex_imag>=0) {
        if(dedx*a/(a+b)>0) signLeftX = -1;
        if(dedy*a/(a+b)>0) signLeftY = -1;
      }
      else {
        if(dedx*a/(a+b)<0) signLeftX = -1;
        if(dedy*a/(a+b)<0) signLeftY = -1;
      }

      return {
        left: {
          x: curr.x + signLeftX*wingX,
          y: curr.x + signLeftY*wingY
        },
        right: {
          x: curr.x - signLeftX*wingX,
          y: curr.y - signLeftY*wingY
        }
      };
    };

    let path_d = "";
    for(let i=0; i<this.points.length; i++) {
      const current_point = this.points[i];
      if(i===0) {if(this.points[1]){this.vertex.push(calcStartWing(current_point,this.points[1]));}}
      else if(i>0) {
        if(i===this.points.length-1) this.vertex.push(calcEndWing(this.points[i-1],current_point));
        else this.vertex.push(calcWing(this.points[i-1],current_point,this.points[i+1]));
      }
    }

    let path_d_first = "";
    let path_d_latter = "";
    for(let i=0; i<this.vertex.length; i++) {
      const curr_first = this.vertex[i]
      const curr_latter = this.vertex[this.vertex.length-1-i];
      if(i===0) {
        path_d_first += `M${curr_first.left.x},${curr_first.left.y}`;
        path_d_latter += ` l${curr_latter.right.x-curr_latter.left.x},${curr_latter.right.y-curr_latter.left.y}`;
      }
      else {
        const prev_first = this.vertex[i-1];
        path_d_first += ` l${curr_first.left.x-prev_first.left.x},${curr_first.left.y-prev_first.left.y}`;
        const prev_latter = this.vertex[this.vertex.length-i];
        path_d_latter += ` l${curr_latter.right.x-prev_latter.right.x},${curr_latter.right.y-prev_latter.right.y}`;
      }
    }

    path_d = `${path_d_first}${path_d_latter} z`;

    */
    let path_line_d = this.pathLine.getAttribute("d");
    if(this.points.length===1) path_line_d = `M${x},${y}`;
    else {
      const prev_point = this.points[this.points.length-2];
      const dx = x - prev_point.x;
      const dy = y - prev_point.y;
      path_line_d += ` l${dx},${dy}`;
    }
    //console.log(path_d);
    //if(this.vertex.length>0) this.path.setAttribute("d",path_d);
    this.pathLine.setAttribute("d",path_line_d);

    //this.deltaPoints.push({dx:dx, dy:dy});

    /*const prev_path_d = this.path.getAttribute("d");
    switch(this.points.length) {
      case 2: // Create Simple Line
        this.path.setAttribute(
          "d",
          prev_path_d + ` l ${dx} ${dy}`
        );
        break;
      case 3: // Create First Control-Points
        const p = this.points;
        const dX12 = p[1].x - p[0].x;
        const dY12 = p[1].y - p[0].y;
        const dX23 = p[2].x - p[1].x;
        const dY23 = p[2].y - p[1].y;
        const at = ((dY12/dX12) + (dY23/dX23))/2;
        const an = dX12/dY12;
        const m12 = {x:(p[0].x+p[1].x)/2, y:(p[0].y+p[1].y)/2};
        const control_x = ((m12.y - p[1].y) - (an*m12.x - at*p[1].x)) / (at-an);
        const control_y = an*control_x + m12.y - an*m12.x;
        const delta_control_x = control_x - p[0].x;
        const delta_control_y = control_y - p[0].y;
        this.path.setAttribute(
          "d",
          `M${p[0].x} ${p[0].y} q ${delta_control_x} ${delta_control_y} ${dx} ${dy}`
        );
        this.controlPoint = {x:control_x, y:control_y};
        this.deltaControlPoint = {dx:delta_control_x, dy:delta_control_y};
        break;
      default: // Only Add Point
        this.path.setAttribute(
          "d",
          prev_path_d + ` t ${dx} ${dy}`
        );
        break;
    }
    */
    /*this.path.setAttribute(
      "d",
      prev_path_d + ` l ${dx} ${dy}`
    );*/
    return this;
  }
}

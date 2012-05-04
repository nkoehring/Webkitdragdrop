// javascript 1.6 will be a dependency

// some array helpers
var Arr = {
  /**
   * returns a copy of the array whithout any null or undefined values
   *
   * @param Array ary
   * @return Array filtered copy
   */
  compact:function(ary) {
    ary.filter(function(v,i,obj) {
      return (v != undefined && v != null)
    })
  },

  /**
   * returns ary_a with values of ary_b copied in it
   *
   * @param Array ary_a
   * @param Array ary_b
   * @return Array ary_a
   */
  extend: function(ary_a, ary_b) {
    for (var key in ary_b) ary_a[key] = ary_b[key]
    return ary_a
  },


}

var null_func = function() {}

var Dom = {
  /**
   * wraps modern DOM search functions to a "jquery alike" one
   * TODO: scoped search (eg find('.foo', '#wrapper'))
   *
   * @param String needle
   * @return DOMElement or Null
   */
  find:function(needle) {
    if(typeof needle != "string") return needle
    if(needle[0] == '#') return document.getElementById(needle.slice(1))
    else if(needle[0] == '.') return document.getElementsByClassName(needle.slice(1))
    else return document.getElementsByTagName(needle)
  },

  //DESCRIPTION
  //	This function was taken from the internet (http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/) and returns 
  //	the computed style of an element independantly from the browser
  //INPUT
  //	oELM (DOM ELEMENT) element whose style should be extracted
  //	strCssRule element
  getCalculatedStyle: function(oElm, strCssRule) {
    var strValue = ""
    if (document.defaultView && document.defaultView.getComputedStyle) {
      strValue = document.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule)
    } else if (oElm.currentStyle) {
      strCssRule = strCssRule.replace(/\-(\w)/g, function(strMatch, p1) {
        return p1.toUpperCase()
      })
      strValue = oElm.currentStyle[strCssRule]
    }
    return strValue
  },

  //bindAsEventListener function - used to bind events
  bindAsEventListener: function(f, object) {
    var __method = f
    return function(event) { __method.call(object, event || window.event) }
  },

  //cumulative offset - courtesy of Prototype (http://www.prototypejs.org)
  cumulativeOffset: function(element) {
    var valueT = 0, valueL = 0
    do {
      valueT += element.offsetTop || 0
      valueL += element.offsetLeft || 0
      if (element.offsetParent == document.body) if (element.style.position == 'absolute') break

      element = element.offsetParent
    } while (element)

    return {
      left: valueL,
      top: valueT
    }
  },

  //getDimensions - courtesy of Prototype (http://www.prototypejs.org)
  getDimensions: function(element) {
    var display = element.style.display
    if (display != 'none' && display != null) // Safari bug
      return { width: element.offsetWidth, height: element.offsetHeight }

    var els = element.style
    var originalVisibility = els.visibility
    var originalPosition = els.position
    var originalDisplay = els.display
    els.visibility = 'hidden'
    // Switching fixed to absolute causes issues in Safari
    if (originalPosition != 'fixed') els.position = 'absolute'
    els.display = 'block'
    var originalWidth = element.clientWidth
    var originalHeight = element.clientHeight
    els.display = originalDisplay
    els.position = originalPosition
    els.visibility = originalVisibility
    return {
      width: originalWidth,
      height: originalHeight
    }
  },

  //hasClassName - courtesy of Prototype (http://www.prototypejs.org)
  hasClassName: function(element, className) {
    var elementClassName = element.className
    return (elementClassName.length > 0 && (elementClassName == className || new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)))
  },

  //addClassName - courtesy of Prototype (http://www.prototypejs.org)
  addClassName: function(element, className) {
    if (!this.hasClassName(element, className)) element.className += (element.className ? ' ' : '') + className
    return element
  },

  //removeClassName - courtesy of Prototype (http://www.prototypejs.org)
  //modified to use javascripts trim instread of Prototypes strip
  removeClassName: function(element, className) {
    element.className = this.trim(element.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' '))
    return element
  },
}

//Description
// Droppable fire events when a draggable is dropped on them
var webkit_droppables = function() {
  this.initialize = function() {
    this.droppables = []
    this.droppableRegions = []
  }

  this.add = function(root, instance_props) {
    root = Dom.find(root)
    var default_props = {
      accept: [],
      hoverClass: null,
      onDrop: null_func,
      onOver: null_func,
      onOut: null_func 
    }
    default_props = Arr.extend(default_props, instance_props || {})
    this.droppables.push({
      r: root,
      p: default_props
    })
  }

  this.remove = function(root) {
    root = Dom.find(root)
    var d = this.droppables
    var i = d.length
    while (i--) {
      if (d[i].r == root) {
        d[i] = null
        this.droppables = Arr.compact(d)
        return true
      }
    }
    return false
  }

  //calculate position and size of all droppables
  this.prepare = function() {
    var d = this.droppables
    var i = d.length
    var regions = []
    var r = null

    while (i--) {
      r = d[i].r
      if (r.style.display != 'none') {
        regions.push({
          i: i,
          size: Dom.getDimensions(r),
          offset: Dom.cumulativeOffset(r)
        })
      }
    }

    this.droppableRegions = regions
  }

  this.finalize = function(x, y, r, e) {
    var indices = this.isOver(x, y)
    var index = this.maxZIndex(indices)
    var over = this.process(index, r)
    if (over)
      this.drop(index, r, e)

    this.process(-1, r)
    return over
  }

  this.check = function(x, y, r) {
    var indices = this.isOver(x, y)
    var index = this.maxZIndex(indices)
    return this.process(index, r)
  }

  this.isOver = function(x, y) {
    var regions = this.droppableRegions
    var i = regions.length
    var active = []
    var r = 0
    var maxX = 0
    var minX = 0
    var maxY = 0
    var minY = 0

    while (i--) {
      r = regions[i]

      minY = r.offset.top
      maxY = minY + r.size.height

      if ((y > minY) && (y < maxY)) {
        minX = r.offset.left
        maxX = minX + r.size.width

        if ((x > minX) && (x < maxX)) active.push(r.i)
      }
    }

    return active
  }

  this.maxZIndex = function(indices) {
    var d = this.droppables
    var l = indices.length
    var index = -1

    var maxZ = -100000000
    var curZ = 0

    while (l--) {
      curZ = parseInt(d[indices[l]].r.style.zIndex || 0)
      if (curZ > maxZ) {
        maxZ = curZ
        index = indices[l]
      }
    }

    return index
  }

  this.process = function(index, draggableRoot) {
    //only perform update if a change has occured
    if (this.lastIndex != index) {
      //remove previous
      if (this.lastIndex != null) {
        var d = this.droppables[this.lastIndex]
        var p = d.p
        var r = d.r

        if (p.hoverClass)
          Dom.removeClassName(r, p.hoverClass)

        p.onOut(draggableRoot)
        this.lastIndex = null
        this.lastOutput = false
      }

      //add new
      if (index != -1) {
        var d = this.droppables[index]
        var p = d.p
        var r = d.r

        if (this.hasClassNames(draggableRoot, p.accept)) {
          if (p.hoverClass) {
            Dom.addClassName(r, p.hoverClass)
          }
          p.onOver(draggableRoot)
          this.lastIndex = index
          this.lastOutput = true
        }
      }
    }
    return this.lastOutput
  }

  this.drop = function(index, r, e) {
    if (index != -1)
      this.droppables[index].p.onDrop(r, e)
  }

  this.hasClassNames = function(r, names) {
    var l = names.length
    if (l == 0)
      return true

    while (l--) {
      if (Dom.hasClassName(r, names[l]))
        return true
    }
    return false
  }

  this.initialize()
}
webkit_drop = new webkit_droppables()

//Description
//webkit draggable - allows users to drag elements with their hands
var webkit_draggable = function(r, ip) {
  this.initialize = function(root, instance_props) {
    this.root = Dom.find(root)
    var default_props = {
      scroll:  false,
      revert:  false,
      handle:  this.root,
      zIndex:  1000,
      onStart: null_func,
      onEnd:   null_func 
    }

    this.props = Arr.extend(default_props, instance_props || {})
    default_props.handle = Dom.find(default_props.handle)
    this.prepare()
    this.bindEvents()
  }

  this.prepare = function() {
    var rs = this.root.style

    //set position
    if (Dom.getCalculatedStyle(this.root, 'position') != 'absolute') rs.position = 'relative'

    //set top, right, bottom, left
    rs.top = rs.top || '0px'
    rs.left = rs.left || '0px'
    rs.right = ""
    rs.bottom = ""

    //set zindex
    rs.zIndex = rs.zIndex || '0'
  }

  this.bindEvents = function() {
    var handle = this.props.handle

    this.tStart = Dom.bindAsEventListener(this.touchStart, this)
    this.tMove  = Dom.bindAsEventListener(this.touchMove, this)
    this.tEnd   = Dom.bindAsEventListener(this.touchEnd, this)

    handle.addEventListener("touchstart", this.tStart, false)
    handle.addEventListener("touchmove", this.tMove, false)
    handle.addEventListener("touchend", this.tEnd, false)
  }

  this.destroy = function() {
    var handle = this.props.handle

    handle.removeEventListener("touchstart", this.tStart)
    handle.removeEventListener("touchmove", this.tMove)
    handle.removeEventListener("touchend", this.tEnd)
  }

  this.set = function(key, value) {
    this.props[key] = value
  }

  this.touchStart = function(event) {
    //prepare needed variables
    var p = this.props
    var r = this.root
    var rs = r.style
    var t = event.targetTouches[0]

    //get position of touch
    touchX = t.pageX
    touchY = t.pageY

    //set base values for position of root
    rs.top = this.root.style.top || '0px'
    rs.left = this.root.style.left || '0px'
    rs.bottom = null
    rs.right = null

    var rootP = Dom.cumulativeOffset(r)
    var cp = this.getPosition()

    //save event properties
    p.rx = cp.x
    p.ry = cp.y
    p.tx = touchX
    p.ty = touchY
    p.z = parseInt(this.root.style.zIndex)

    //boost zIndex
    rs.zIndex = p.zIndex
    webkit_drop.prepare()
    p.onStart(r)
  }

  this.touchMove = function(event) {
    event.preventDefault()
    event.stopPropagation()

    //prepare needed variables
    var p = this.props
    var r = this.root
    var rs = r.style
    var t = event.targetTouches[0]
    if (t == null) {
      return
    }

    var curX = t.pageX
    var curY = t.pageY

    var delX = curX - p.tx
    var delY = curY - p.ty

    rs.left = p.rx + delX + 'px'
    rs.top = p.ry + delY + 'px'

    //scroll window
    if (p.scroll) {
      s = this.getScroll(curX, curY)
      if ((s[0] != 0) || (s[1] != 0)) {
        window.scrollTo(window.scrollX + s[0], window.scrollY + s[1])
      }
    }

    //check droppables
    webkit_drop.check(curX, curY, r)

    //save position for touchEnd
    this.lastCurX = curX
    this.lastCurY = curY
  }

  this.touchEnd = function(event) {
    var r = this.root
    var p = this.props
    var dropped = webkit_drop.finalize(this.lastCurX, this.lastCurY, r, event)

    if (((p.revert) && (!dropped)) || (p.revert === 'always')) {
      //revert root
      var rs = r.style
      rs.top = (p.ry + 'px')
      rs.left = (p.rx + 'px')
    }

    r.style.zIndex = p.z
    p.onEnd(r)
  }

  this.getPosition = function() {
    var rs = this.root.style
    return {
      x: parseInt(rs.left || 0),
      y: parseInt(rs.top || 0)
    }
  }

  this.getScroll = function(pX, pY) {
    //read window variables
    var sX = window.scrollX
    var sY = window.scrollY

    var wX = window.innerWidth
    var wY = window.innerHeight

    //set contants		
    var scroll_amount = 10; //how many pixels to scroll
    var scroll_sensitivity = 100; //how many pixels from border to start scrolling from.
    var delX = 0
    var delY = 0

    //process vertical y scroll
    if (pY - sY < scroll_sensitivity) {
      delY = -scroll_amount
    } else if ((sY + wY) - pY < scroll_sensitivity) {
      delY = scroll_amount
    }

    //process horizontal x scroll
    if (pX - sX < scroll_sensitivity) {
      delX = -scroll_amount
    } else if ((sX + wX) - pX < scroll_sensitivity) {
      delX = scroll_amount
    }

    return [delX, delY]
  }

  //contructor
  this.initialize(r, ip)
}
    
    
    
    //Description
     //webkit_click class. manages click events for draggables
    
    
var webkit_click = function(r, ip) {
    this.initialize = function(root, instance_props) {
      var default_props = { onClick: null_func }

      this.root = Dom.find(root)
      this.props = Arr.extend(default_props, instance_props || {})
      this.bindEvents()
    }

    this.bindEvents = function() {
      var root = this.root

      //bind events to local scope
      this.tStart = Dom.bindAsEventListener(this.touchStart, this)
      this.tMove =  Dom.bindAsEventListener(this.touchMove, this)
      this.tEnd =   Dom.bindAsEventListener(this.touchEnd, this)

      //add Listeners
      root.addEventListener("touchstart", this.tStart, false)
      root.addEventListener("touchmove", this.tMove, false)
      root.addEventListener("touchend", this.tEnd, false)

      this.bound = true
    }

    this.touchStart = function() {
      this.moved = false
      if (this.bound == false) {
        this.root.addEventListener("touchmove", this.tMove, false)
        this.bound = true
      }
    }

    this.touchMove = function() {
      this.moved = true
      this.root.removeEventListener("touchmove", this.tMove)
      this.bound = false
    }

    this.touchEnd = function() {
      if (this.moved == false) this.props.onClick()
    }

    this.setEvent = function(f) {
      if (typeof(f) == 'function') {
        this.props.onClick = f
      }
    }

    this.unbind = function() {
      var root = this.root
      root.removeEventListener("touchstart", this.tStart)
      root.removeEventListener("touchmove", this.tMove)
      root.removeEventListener("touchend", this.tEnd)
    }

    //call constructor
    this.initialize(r, ip)
    }

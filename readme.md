# webkitdragdrop

#### (name will be changed, I think)

My try to make this quite usable drag'n'drop library way more usable ...and to
cleanup the code a bit.

To see it in action, look at http://nkoehring.github.com/Webkitdragdrop/ which
will be updated with the library.


## Usage

#### Current usage of webkitdragdrop is like:

```javascript
  var drag = new webkit_draggable('drag', { revert:true, scroll:false })
  var drag2 = new webkit_draggable('drag2', { revert:true, scroll:false })
  webkit_drop.add('drop', { hoverClass:"hovered" })
```


#### The (yet not reached) usage goal is like:

```javascript
var dd = new DragsnDrops({
  drags: [
    {id:1, element:'#drag', revert:true, scroll:false},
    /* id defaults to the element selector */
    {element:'#drag2', revert:true, scroll:false}
  ],

  drops: [
    /* 'only' means, this drop works only for this draggable(s) */
    {element: '#drop', only:1},
    {element: '#drop2'}
  ]
})

// or even nicer for the most typical configuration
var dd = new DragsnDrops({
  default_drag_options: {revert:true, scroll:false},
  drags: $('#draggables .box'),
  drops: $('#droppables .box')
})
```


--

original version Copyright (c) 2010 Tommaso Buvoli
(http://www.tommasobuvoli.com), forked by by https://github.com/cybear


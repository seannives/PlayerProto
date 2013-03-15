// alert('loaded solutionAppletLabel.js');

// ------------- Class definition -----------------------------------------------------

GadgetTypes.solutionAppletLabel = function(config) {
    // Standard gadget data
    this.type = 'solutionAppletLabel';
    this.version = '1.1.1';
    this.config = !config || !config.config ? {} : config.config;
    this.id = solutionAppletLabel_GADGET_ID_COUNTER++;
    this.nodeID = this.type +'_'+this.id+'_area';
    this.isActive = false;
    this.isEditMode = false;
    
    // Gadget-specific data
    if (!this.config.labels) this.config.labels = [];
    if (!this.config.targets) this.config.targets = [];
    
    this.labels = {};
    this.targets = {};
}

var solutionAppletLabel_GADGET_ID_COUNTER = 0; // Maintains unique IDs

emulate(GadgetTypes.solutionAppletLabel, GadgetBase);


// ------------- Prototype innards -----------------------------------------------------

Mx.yui.inst().use('node', 'dd', 'dd-delegate', 'dd-constrain', function(Y) {

   
    // -------------------- Public functions ----------------------------------------------------------------------------------------

    
    GadgetTypes.solutionAppletLabel.prototype.editMode = function() {
        this.isEditMode = !this.isEditMode;

        if (this.isEditMode) {
            this.node.addClass('edit-mode');
            var editnode = Y.Node.create('<div class="tmp">Edit mode ON!</div>');
            this.node.append(editnode);
            var urlnode = Y.Node.create('<div class="tmp">URL: <input class="urly" size="80" value="http://www.markleford.com/pics/tmp/I71Northand270-LargeReverse.jpg" /></div>');
            this.node.append(urlnode);
            
        }
        else {
            // TODO: Scrape url and redirect img
            var urlnode = this.node.one('.urly');
            this.config.img = urlnode.get('value');
            this.node.one('img.pull').set('src', this.config.img);
        
            this.node.removeClass('edit-mode');
            //var editnode = this.node.all('.tmp').remove(true);;
            //editnode && editnode.remove(true);
            this.node.all('.tmp').remove(true);
        }
        
        return this.isEditMode;
    }
    
    GadgetTypes.solutionAppletLabel.prototype.freeze = function(unfreeze) {
        this.isActive = unfreeze ? true : false;

        if (this.isActive) {
            // Coming back from a freeze!
        }
        else {
            // Freeze frame! (dah-dah-dahhhh-da-dah-dah-dah)

            // Disable DD
            // TODO: Find a way to disable this, but still allow an unfreeze later
            //this.delegate.destroy()
        }
        
        return this.isActive;
    }
    
    GadgetTypes.solutionAppletLabel.prototype.getAnswer = function() {
        if (!this.isActive) return null;
        
        var solstr = '';
        for (var id in this.targets) {
            if (solstr) solstr = solstr + ':';
            solstr = solstr + ('target_'+this.targets[id].id+'='+(this.targets[id].label?this.targets[id].label.id:''));
        }
        
        return solstr;
    }
    
    GadgetTypes.solutionAppletLabel.prototype.showAnswer = function(chunk) {
        if (!this.isActive) return null;
        
        for (var id in this.targets) {
            if (this.targets[id].label && (this.targets[id].id == this.targets[id].label.id)) {
                continue;
            }
            if ((this.targets[id].id == '') && this.targets[id].label) {
                this._returnToHome(this.targets[id].label);
                continue;
            }
            if (this.targets[id].label && (this.targets[id].id != this.targets[id].label.id)) {
                this._returnToHome(this.targets[id].label);
            }
            
            this._sendTo((this._findLabelById(this.targets[id].id)).node, this.targets[id].node);
        }
        
        return null;
    }
        

    
    GadgetTypes.solutionAppletLabel.prototype.render = function(worknode) {
        if (!worknode) return null;
        
        var appnode = Y.Node.create('<div id="'+this.nodeID+'" type="'+this.type+'" class="gadget '+this.type+'"></div>');
        worknode.append(appnode);

        // Remember the node for easy retrieval
        this.node = appnode;

        // Someone set us up the image
        var imgnode = Y.Node.create('<img class="pull embed" src="'+this.config.img+'" />');
        appnode.append(imgnode);
        // Scooch the image over a bit
        imgnode.setStyle('marginLeft', this.config.imgOffset);

        if (!this.config.labels || !this.config.labels.length) {
            var warndiv = Y.Node.create('<div>Warning: no labels in config</div>');
            appnode.append(warndiv);
        }
        
        // Create the labels
        for (var i = 0; i < this.config.labels.length; i++) {
            var label = {};
            label.left = 0;
            label.top = i * this.config.labelSpacing;
            label.nodeID = this.type+'_'+this.id+'_label_'+i;
            label.id = this.config.labels[i].id;
            label.text = this.config.labels[i].text;
            label.target = null;
            
            var labelnode = Y.Node.create('<div id="'+label.nodeID+'" class="label dragme">'+label.text+'</div>');
            appnode.append(labelnode);
            
            label.node = labelnode;
            
            labelnode.setStyle('left', label.left);
            labelnode.setStyle('top', label.top);
            labelnode.setStyle('width', this.config.labelWidth);
            labelnode.setAttribute('tabindex', 0);
            
            this.labels[label.nodeID] = label;
        }

        if (!this.config.targets || !this.config.targets.length) {
            var warndiv = Y.Node.create('<div>Warning: no targets in config</div>');
            appnode.append(warndiv);
        }
        
        // Create the targets
        for (var i = 0; i < this.config.targets.length; i++) {
            var target = {};
            target.id = this.config.targets[i].id;
            target.left = this.config.targets[i].x;
            target.top = this.config.targets[i].y;
            target.nodeID = this.type+'_'+this.id+'_target_'+i;
            target.label = null;
            
            var targnode = Y.Node.create('<div id="'+target.nodeID+'" class="label target"></div>');
            appnode.append(targnode);
            
            target.node = targnode;
            
            targnode.setStyle('left', target.left);
            targnode.setStyle('top', target.top);
            targnode.setStyle('width', this.config.labelWidth);
            //targnode.setAttribute('tabindex', 0);
            
            this.targets[target.nodeID] = target;
        }

        // Drag and drop (via delegate)
        var del = new Y.DD.Delegate({
            container: appnode,
            nodes: '.dragme'
        });
        
        del.dd.plug(Y.Plugin.DDConstrained, {
            constrain2node: appnode
        });
        
        // TODO: Can we do drops by delegate as well? Or is it just drags?
        Y.all('.label.target').each(function(node) {
            node.plug(Y.Plugin.Drop);
        });

        // DD start and stop
        
        del.on('drag:start', function(e) {
            var n = del.get('currentNode');
            n.addClass('active');
        });
        
        del.on('drag:end', function(e) {
            var n = del.get('currentNode');
            n.removeClass('active');
        });
        
        // Drop conditions: the interesting stuff!
        
        del.on('drag:drophit', function(e) {
            var labelNode = del.get('currentNode');
            var targetNode = e.drop.get('node');
            
            this._sendTo(labelNode, targetNode);
        }, this);
        
        del.on('drag:dropmiss', function(e) {
            var n = del.get('currentNode');
            var label = this.labels[n.getAttribute('id')];
            if (label) this._returnToHome(label);
        }, this);
        
        this.delegate = del;
        
        // Bottom corner controls
        var bottomnode = Y.Node.create('<div class="bottomlinks"></div>');
        appnode.append(bottomnode);
        
        // Reset button!
        var resetnode = Y.Node.create('<a class="resetlink">reset</a>');
        bottomnode.append(resetnode);
        resetnode.on('click', function() {
            if (!this.isActive) return;
            for (var id in this.labels) {
                this._returnToHome(this.labels[id]);
            }
        }, this);
        resetnode.setAttribute('tabindex', 0);

        
        //bottomnode.append(Y.Node.create('<br />'));
        

        this.isActive = true;
        return appnode;
    };
    
    
    // -------------------- Private functions ----------------------------------------------------------------------------------------
    

    GadgetTypes.solutionAppletLabel.prototype._findLabelById = function(targ) {
        for (var id in this.labels) {
            if (this.labels[id].id == targ) return this.labels[id];
        }
        
        return null;
    }

    GadgetTypes.solutionAppletLabel.prototype._returnToHome = function(label) {
        if (!this.isActive) return null;

        //var n = Y.one('#'+label.nodeID);
        var n = label.node;
        n.setStyle('top', label.top);
        n.setStyle('left', label.left);
        if (label.target) {
            // Remove back-references
            label.target.label = null;
            label.target = null;
        }
    }

    GadgetTypes.solutionAppletLabel.prototype._sendTo = function(labelNode, targetNode) {
        if (!this.isActive || !labelNode || !targetNode) return; 

        var target = this.targets[targetNode.getAttribute('id')]
        var label = this.labels[labelNode.getAttribute('id')];

        // Displace old label
        if (target.label) this._returnToHome(target.label);
        
        // Snap to target
        var xy = targetNode.getXY();
        labelNode.setXY(xy);

        // Store back-references!
        target.label = label;
        label.target = target;
    }
 

});






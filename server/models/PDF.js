const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');

const PDFSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  filePath: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'comment', 'edit'],
      default: 'view'
    },
    expiresAt: {
      type: Date
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  shareSettings: {
    password: {
      type: String,
      select: false // Don't include in queries by default
    },
    expiresAt: {
      type: Date
    },
    allowDownload: {
      type: Boolean,
      default: true
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    maxViews: {
      type: Number
    }
  },
  views: [{
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  downloads: [{
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    formattedContent: {
      type: String
    },
    page: {
      type: Number
    },
    position: {
      x: Number,
      y: Number
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true
      },
      formattedContent: {
        type: String
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  lastViewed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
PDFSchema.index({ owner: 1 });
PDFSchema.index({ shareToken: 1 });
PDFSchema.index({ 'sharedWith.user': 1 });
PDFSchema.index({ 'shareSettings.expiresAt': 1 });
PDFSchema.index({ createdAt: -1 });

// Add method to increment views
PDFSchema.methods.incrementViews = async function() {
  try {
    // Ensure views is an array
    if (!Array.isArray(this.views)) {
      this.views = [];
    }
    
    // Add new view
    this.views.push({ timestamp: new Date() });
    this.lastViewed = new Date();
    
    return this.save();
  } catch (error) {
    console.error('Error incrementing views:', error);
    // If there's an error, try to reset views to a valid state
    this.views = [{ timestamp: new Date() }];
    this.lastViewed = new Date();
    return this.save();
  }
};

// Add method to increment downloads
PDFSchema.methods.incrementDownloads = async function() {
  this.downloads.push({ timestamp: new Date() });
  return this.save();
};

// Add method to add comment
PDFSchema.methods.addComment = async function(commentData) {
  this.comments.push(commentData);
  return this.save();
};

// Add method to add reply
PDFSchema.methods.addReply = async function(commentId, replyData) {
  const comment = this.comments.id(commentId);
  if (comment) {
    comment.replies.push(replyData);
    return this.save();
  }
  throw new Error('Comment not found');
};

// Add validation for file path
PDFSchema.path('filePath').validate(function(value) {
  console.log('Validating filePath:', {
    value,
    type: typeof value,
    length: value ? value.length : 0,
    isString: typeof value === 'string',
    isNotEmpty: value && value.length > 0,
    doc: this.toObject()
  });

  // Check if value is a non-empty string
  if (!value || typeof value !== 'string' || value.length === 0) {
    console.error('Invalid filePath value:', {
      value,
      type: typeof value,
      length: value ? value.length : 0,
      isString: typeof value === 'string',
      isNotEmpty: value && value.length > 0
    });
    return false;
  }

  // Check if the path is relative and starts with 'uploads/'
  if (!value.startsWith('uploads/')) {
    console.error('filePath must start with uploads/:', {
      value,
      startsWithUploads: value.startsWith('uploads/')
    });
    return false;
  }

  return true;
}, 'File path must be a non-empty string starting with uploads/');

// Add pre-save middleware to ensure filePath is set correctly
PDFSchema.pre('save', function(next) {
  console.log('Pre-save middleware:', {
    filePath: this.filePath,
    path: this.path,
    isModified: this.isModified('filePath'),
    doc: this.toObject()
  });

  if (!this.shareToken) {
    this.shareToken = crypto.randomBytes(16).toString('hex');
  }
  this.updatedAt = Date.now();
  
  // Ensure filePath is set and properly formatted
  if (!this.filePath) {
    if (this.path) {
      this.filePath = this.path;
      console.log('Setting filePath from path:', {
        path: this.path,
        filePath: this.filePath
      });
    } else {
      console.error('No filePath or path provided');
      return next(new Error('File path is required'));
    }
  }
  
  // Ensure filePath is a relative path starting with uploads/
  if (this.filePath && this.isModified('filePath')) {
    // If it's an absolute path, convert to relative
    if (path.isAbsolute(this.filePath)) {
      const basename = path.basename(this.filePath);
      this.filePath = `uploads/${basename}`;
      console.log('Converted absolute path to relative:', {
        original: this.filePath,
        converted: `uploads/${basename}`
      });
    }
    // If it doesn't start with uploads/, add it
    else if (!this.filePath.startsWith('uploads/')) {
      this.filePath = `uploads/${path.basename(this.filePath)}`;
      console.log('Added uploads/ prefix to path:', {
        original: this.filePath,
        converted: `uploads/${path.basename(this.filePath)}`
      });
    }
  }
  
  console.log('After pre-save middleware:', {
    filePath: this.filePath,
    path: this.path,
    doc: this.toObject()
  });
  
  next();
});

// Add virtual for path to maintain compatibility
PDFSchema.virtual('path').get(function() {
  return this.filePath;
});

// Ensure virtuals are included in JSON
PDFSchema.set('toJSON', { virtuals: true });
PDFSchema.set('toObject', { virtuals: true });

// Add pre-find middleware to ensure filePath is populated
PDFSchema.pre('find', function() {
  this.select('+filePath');
});

PDFSchema.pre('findOne', function() {
  this.select('+filePath');
});

PDFSchema.pre('findById', function() {
  this.select('+filePath');
});

// Method to check if share is expired
PDFSchema.methods.isShareExpired = function() {
  if (this.shareSettings?.expiresAt) {
    return new Date() > this.shareSettings.expiresAt;
  }
  return false;
};

// Method to check if max views reached
PDFSchema.methods.hasReachedMaxViews = function() {
  if (this.shareSettings?.maxViews) {
    return this.views >= this.shareSettings.maxViews;
  }
  return false;
};

// Add a method to get view count
PDFSchema.methods.getViewCount = function() {
  if (Array.isArray(this.views)) {
    return this.views.length;
  }
  return typeof this.views === 'number' ? this.views : 0;
};

module.exports = mongoose.model('PDF', PDFSchema); 
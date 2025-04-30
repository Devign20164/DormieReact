const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for Comments
const CommentSchema = new Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Main News Schema
const NewsSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Announcement', 'Event', 'Notice', 'Update']
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  author: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  pinned: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  image: {
    type: String,  // URL to the uploaded image
    default: null
  },
  imageCaption: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  published: {
    type: Boolean,
    default: true
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [CommentSchema],
  featured: {
    type: Boolean,
    default: false
  },
  slug: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Indexes for faster querying
NewsSchema.index({ publishDate: -1 });
NewsSchema.index({ category: 1 });
NewsSchema.index({ isActive: 1 });
NewsSchema.index({ pinned: -1 });
NewsSchema.index({ tags: 1 });

// Virtual for like count
NewsSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
NewsSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Pre-save hook to create slug from title
NewsSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
  }
  
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  
  next();
});

// Methods
NewsSchema.methods = {
  // Add a like from a user
  addLike: function(userId) {
    if (!this.likes.includes(userId)) {
      this.likes.push(userId);
    }
    return this.save();
  },
  
  // Remove a like from a user
  removeLike: function(userId) {
    this.likes = this.likes.filter(id => id.toString() !== userId.toString());
    return this.save();
  },
  
  // Add a comment
  addComment: function(userId, content) {
    this.comments.push({
      user: userId,
      content: content
    });
    return this.save();
  },
  
  // Remove a comment
  removeComment: function(commentId) {
    this.comments = this.comments.filter(comment => comment._id.toString() !== commentId.toString());
    return this.save();
  },
  
  // Increment view count
  incrementViews: function() {
    this.viewCount += 1;
    return this.save();
  }
};

// Create and export the model
const News = mongoose.model('News', NewsSchema);
module.exports = News;
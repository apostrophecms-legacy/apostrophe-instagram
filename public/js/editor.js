// @class Editor for Instagram widgets

function AposInstagramWidgetEditor(options) {
  var self = this;

  self.type = 'instagram';
  options.template = '.apos-instagram-editor';

  AposWidgetEditor.call(self, options);

  // // What are these doing?
  // self.preSave = getPosts;

  self.afterCreatingEl = function() {
    self.$userName = self.$el.find('[name="instagramUsername"]');
    self.$userName.val(self.data.userName);
    self.$limit = self.$el.find('[name="instagramLimit"]');
    self.$limit.val(self.data.limit || 10);
    setTimeout(function() {
      self.$userName.focus();
      //self.$pageUrl.setSelection(0, 0);
    }, 500);
  };


  self.preSave = function(callback) {
    self.exists = !!self.$userName.val();
    if (self.exists) {
      self.data.userName = self.$userName.val();
      self.data.limit = self.$limit.val();
      return getUserId(self.$userName.val(), callback);
    }

  }

  function getUserId(userName, callback){

    $.ajax({
      type: 'GET',
      url: '/apos-instagram/user/id?userName='+userName,
      dataType: 'json',
      //data: {userName: userName},
      success: function(userId){
        self.data.user_id = userId;
        return callback();
      }
    });
  }
}

AposInstagramWidgetEditor.label = 'Instagram';

apos.addWidgetType('instagram');

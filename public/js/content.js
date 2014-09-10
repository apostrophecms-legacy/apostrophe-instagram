apos.widgetPlayers.instagram = function($el) {

  // N.B. Even though this is a player, it's not getting refreshed
  // once it's been created. Hrmmm.

  var data = apos.getWidgetData($el);
  $.ajax({
    dataType: "json",
    url: '/apos-instagram/photos',
    data: {id: data.user_id, limit: data.limit},
    success: function(photos){
      //Define our photos object as well as the template and loader.
      var $photos = $el.find('[data-apos-instagram-photos]'),
          $photoTemplate = $photos.find('[data-template]'),
          $loader = $photos.find('[data-apos-instagram-loader]');

      if (!photos.length) {
        $el.trigger('aposInstagramNull');
        return;
      }

      function init(){
        generatePhotoMarkup(photos);
      }

      function removeTemplate(){
        $photoTemplate.remove();
      };

      function buildTemplate($template){
        $template.$date = $template.find('[data-apos-instagram-date]');
        $template.$image = $template.find('[data-apos-instagram-image]');
        $template.$caption = $template.find('[data-apos-instagram-caption]');
        $template.$likes = $template.find('[data-apos-instagram-likes]');
        return $template;
      }

      function cloneTemplate($obj){
        $clone = $obj.clone();
        $clone.removeAttr('data-template');
        clone = buildTemplate($clone);
        return clone;
      }

      function getInstagramDate(date){
        var postDate = new Date(parseInt(date) * 1000),
            postMonth = postDate.getMonth() + 1,
            postDay = postDate.getDate(),
            postYear = postDate.getFullYear(),
            thisYear = new Date().getFullYear();

        return ((postYear != thisYear ) ? postMonth +"/"+postDay+"/"+postYear: postMonth +"/"+postDay);
      }

      function generatePhotoMarkup(photos){
        _.each(photos, function(photo){
          //Clone our Template
          var $photo = cloneTemplate($photoTemplate);

          //Add Image src.
          if(photo.image.url){
            $photo.$image.attr('src', photo.image.url);
          } else {
            $photo.$image.remove();
          }

          // Add the caption.
          if(photo.caption && photo.caption.text){
            $photo.$caption.html(photo.caption.text);
          } else {
            $photo.$caption.remove();
          }

          // Add the like count.
          if(photo.likes && photo.likes.count > 0){
            $photo.$likes.text(photo.likes.count);
          } else {
            $photo.$likes.remove();
          }

          // Add the date.
          if(photo.date){
            $photo.$date.text(getInstagramDate(photo.date));
          } else {
            $photo.$caption.remove();
          }

          //If there's still a loader, kill it.
          $loader.remove();

          //Add That to the List
          $photos.append($photo);
          $photos.toggleClass('apos-template', false);
        });
        removeTemplate();

        //Need to add a hook in here to create project-specific galleries.
        apos.widgetPlayers.instagram.afterLoad($el, photos);
      };

      init();
    }
  });
}
apos.widgetPlayers.instagram.afterLoad = function($el, photos){
  // For instagram, we're passing the whole blob of data (the photos array)
  // through to you so that you can just work your magic on them as you see fit.
};

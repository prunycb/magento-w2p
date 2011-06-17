function precalculate_shapes (template_details) {
  for (var page in template_details.pages)
    for (var name in template_details.pages[page].shapes) {
      var shape = template_details.pages[page].shapes[name];

      shape.left = shape.x1 * 100;
      shape.top = shape.y1 * 100;
      shape.width = (shape.x2 - shape.x1) * 100;
      shape.height = (shape.y2 - shape.y1) * 100;
    }
}

function place_shape (shape, $container, shape_handler) {
  if (shape['has-value'])
    var edited_class = ' edited';
  else
    var edited_class = '';

  jQuery('<div class="zetaprints-field-shape bottom hide' + edited_class + '" rel="' + shape.name  +
    '"><div class="zetaprints-field-shape top" /></div>')
    .css({
      top: shape.top + '%',
      left: shape.left + '%',
      width: shape.width + '%',
      height: shape.height + '%' })
    .bind('click mouseover mouseout', { container: $container }, shape_handler)
    .appendTo($container);
}

function place_all_shapes_for_page (shapes, $container, shape_handler) {
  if (!shapes)
    return;

  for (name in shapes)
    if (!shapes[name].hidden)
      place_shape(shapes[name], $container, shape_handler);
}

function remove_all_shapes (container) {
  jQuery('div.zetaprints-field-shape', container).remove();
}

function highlight_shape_by_name (name, container) {
  jQuery('div.zetaprints-field-shape[rel="' + name +'"]', container).addClass('highlighted');
}

function dehighlight_shape_by_name (name, container) {
  jQuery('div.zetaprints-field-shape[rel="' + name +'"]', container).removeClass('highlighted');
}

function highlight_field_by_name (name) {
  var $field = jQuery('*[name="zetaprints-_'+ name +'"], ' +
                      'div.zetaprints-images-selector[rel="zetaprints-#' +
                      name + '"] div.head');

  if ($field.parent().hasClass('zetaprints-text-field-wrapper'))
    $field = $field.parent();

  $field.addClass('highlighted');
}

function dehighlight_field_by_name (name) {
  jQuery('.zetaprints-page-input-fields .highlighted,' +
         '.zetaprints-page-stock-images .highlighted')
    .removeClass('highlighted');
}

function popup_field_by_name (name, position, selected_shapes) {
  var $tabs = jQuery('<div class="fieldbox-tabs fieldbox-wrapper">' +
                      '<a class="fieldbox-button" href="#" />' +
                      '<ul class="fieldbox-head"/>' +
                    '</div>');

  var $ul = $tabs.children('ul');

  var $shape = jQuery('#fancybox-content')
                 .find('.zetaprints-field-shape[rel="' + name + '"]');

  var page = zp.template_details.pages[zp.current_page];

  for (var i = 0; i < selected_shapes.length; i++) {
    var shape_name = selected_shapes[i];

    var tab_title = shape_name;

    if (shape_name.length > 5)
      tab_title = shape_name.substring(0, 5) + '&hellip;';

    var $li = jQuery('<li title="' + shape_name + '">' +
                       '<a href="#fieldbox-tab-' + i + '">' +
                         tab_title +
                       '</a>' +
                     '</li>')
                .appendTo($ul);

    if (page.fields[shape_name]) {
      var $field = jQuery('#input-fields-page-' + zp.current_page)
                     .find('*[name="zetaprints-_'+ shape_name +'"]')
                     .not(':hidden');

      var width = 'auto';
      var min_width = $shape.outerWidth();

      if (min_width <= 150)
        min_width = 150;

      var full_name = 'zetaprints-_'+ name;

      if (page.fields[shape_name]['colour-picker'] == 'RGB')
        $field.text_field_editor('move', $li);
    }
    else if (page.images[shape_name]) {
      var $parent = jQuery('#stock-images-page-' + zp.current_page)
                     .find('*[rel="zetaprints-#' + shape_name + '"]')
                     .removeClass('minimized');

      if ($parent.hasClass('expanded'))
          $parent.find('.collapse-expand').click();

      var $field = $parent.children('.selector-content');

      var width = 400;
      var min_width = 400;

      //Remember checked radio button for IE7 workaround
      var $input = $field.find(':checked');

      var full_name = 'zetaprints-#' + name;
    }

    $field
      .data('in-preview-edit', { 'style': $field.attr('style'),
                                 'parent': $field.parent() })
      .detach()
      .removeAttr('style')
      .css('border', 'none')
      .wrap('<div id="fieldbox-tab-' + i + '" class="fieldbox-field" />')
      .parent()
      .css({ width: width,
             minWidth: min_width })
      .appendTo($tabs);

    if (jQuery.browser.msie && jQuery.browser.version == '7.0')
      //Oh God, it's a sad story :-(
      $field.width(min_width);
  }

  $ul.append('<li class="last" />');

  $tabs.tabs();

  $shape
    .append('<input type="hidden" name="field" value="' + full_name + '" />');

  var $box = jQuery('<div class="fieldbox" rel="' + name + '" />')
               .append($tabs)
               .appendTo('body');

  $box.find('.fieldbox-button').click(function () {
    popdown_field_by_name(jQuery(this).attr('rel'));

    dehighlight_shape_by_name(jQuery(this).attr('rel').substring(12),
                              get_current_shapes_container());

    return false;
  });

  //!!! Stupid work around for stupid IE7
  if ($input)
    $input.change().attr('checked', 1);

  var height = $box.outerHeight();
  var width = $box.outerWidth();

  if (!position) {
    position = $shape.offset();
    position.top += $shape.outerHeight() - 10;
    position.left += 10;
  }

  var window_height = jQuery(window).height() + jQuery(window).scrollTop();
  if ((position.top + height) > window_height)
    position.top -= position.top + height - window_height;

  var window_width = jQuery(window).width();
  if ((position.left + width) > window_width)
    position.left -= position.left + width - window_width;

  $box.css({
    visibility: 'visible',
    left: position.left,
    top: position.top }).draggable({ handle: 'div.fieldbox-head' });

  //!!! Workaround and temp. solution
  if ($field.hasClass('selector-content')) {
    zp.show_user_images($field);

    var $panel = jQuery($field
                          .find('ul.tab-buttons li.ui-tabs-selected a')
                          .attr('href') );

    zp.scroll_strip($panel);
    zp.show_colorpicker($panel);
  }

  $field.focus();

  var field = $field[0];

  //Workaround for IE browser.
  //It moves cursor to the end of input field after focus.
  if (field.createTextRange) {
    var range = field.createTextRange();
    var position = jQuery(field).val().length;

    range.collapse(true);
    range.move('character', position);
    range.select();
  }
}

function popdown_field_by_name (full_name) {
  if (full_name)
    var field = jQuery('*[value="'+ full_name +'"]', jQuery('div#fancybox-content'));
  else
    var field = jQuery(':input', jQuery('div#fancybox-content'));

  if (!field.length)
    return;

  if (!full_name)
    full_name = jQuery(field).attr('value');

  var name = full_name.substring(12);

  var $box = jQuery('.fieldbox[rel="' + name + '"]');

  $box.find('.fieldbox-field').children().each(function () {
    var $element = jQuery(this);

    var data = $element.data('in-preview-edit');

    //Remember checked radio button for IE7 workaround
    var $input = $element.find(':checked');

    //!!! Following code checks back initially selected radio button
    //!!! Don't know why it happens
    $element
      .detach()
      .appendTo(data.parent);

    if (data.style == undefined)
      $element.removeAttr('style');
    else
      $element.attr('style', data.style);

    //!!! Stupid work around for stupid IE7
    $input.change().attr('checked', 1);

    $element.text_field_editor('move',
                               data.parent.parents('dl').children('dt'));

    if (data.parent.hasClass('zetaprints-images-selector'))
      zp.scroll_strip(jQuery($element
                              .find('ul.tab-buttons li.ui-tabs-selected a')
                              .attr('href')) );
  });

  $box.remove();

  jQuery(field).remove();

  jQuery('#current-shape').attr('id', '');

  return name;
}

function mark_shape_as_edited (shape) {
  jQuery('div.zetaprints-field-shape[rel="' + shape.name + '"]').addClass('edited');

  shape['has-value'] = true;
}

function unmark_shape_as_edited (shape) {
  jQuery('div.zetaprints-field-shape[rel="' + shape.name + '"]').removeClass('edited');

  shape['has-value'] = false;
}

function get_current_shapes_container () {
  var container = jQuery('div#fancybox-content:visible');
  if (container.length)
    return container[0];

  return jQuery('div.product-img-box');
}

function _glob_to_rel_coords (x, y, $container) {
  var container_offset = $container.offset();

  x = x - container_offset.left;
  y = y - container_offset.top;

  var width = $container.width();
  var height = $container.height();

  return { x: x / width, y: y / height };
}

function get_shapes_by_coords (c) {
  var page = zp.template_details.pages[zp.current_page];

  var shapes = [];

  for (var name in page.shapes) {
    var shape = page.shapes[name];

    if (shape.x1 <= c.x && c.x <= shape.x2
        && shape.y1 <= c.y && c.y <= shape.y2)
      shapes.push(shape);
  }

  return shapes;
}

function shape_handler (event) {
  var shape = jQuery(event.target).parent();

  if (event.type == 'click') {
    var c = _glob_to_rel_coords(event.pageX, event.pageY, event.data.container);
    var shapes = get_shapes_by_coords(c);

    for (var i = 0; i < shapes.length; i++)
      event.data.container
        .find('.zetaprints-field-shape.bottom[rel="' + shapes[i].name  + '"]')
        .addClass('zetaprints-shape-selected');

    jQuery('#current-shape').attr('id', '');
    jQuery(shape).attr('id', 'current-shape');

    jQuery('a.zetaprints-template-preview:visible', jQuery(shape).parent())
      .click();
  } else if (event.type == 'mouseover') {
    jQuery('#zetaprints-preview-image-container > div.zetaprints-field-shape.bottom')
      .removeClass('highlighted');
    jQuery(shape).addClass('highlighted');

      highlight_field_by_name (jQuery(shape).attr('rel'));
    } else {
      jQuery(shape).removeClass('highlighted');

      dehighlight_field_by_name (jQuery(shape).attr('rel'));
    }
}

function fancy_shape_handler (event) {
  var shape = jQuery(event.target).parent();

  if (event.type == 'click') {
    if (jQuery(shape).children().length > 1)
      return false;

    jQuery('div#fancybox-content div.zetaprints-field-shape.highlighted')
      .removeClass('highlighted');

    shape.addClass("highlighted");

    popdown_field_by_name(undefined, true);

    var c = _glob_to_rel_coords(event.pageX, event.pageY, event.data.container);
    var selected_shapes = get_shapes_by_coords(c);

    var selected_shapes_names = [];

    for (var i = 0; i < selected_shapes.length; i++)
      selected_shapes_names.push(selected_shapes[i].name);

    popup_field_by_name(jQuery(shape).attr('rel'),
                        { top: event.pageY, left: event.pageX },
                        selected_shapes_names);

    return false;
  }

  if (event.type == 'mouseover') {
    var highlighted = jQuery('div#fancybox-content > div.zetaprints-field-shape.highlighted');
    if (jQuery(highlighted).children().length <= 1)
      jQuery(highlighted).removeClass('highlighted');

    jQuery(shape).addClass('highlighted');
  } else
    if (jQuery(shape).children().length <= 1)
      jQuery(shape).removeClass('highlighted');
}

function add_in_preview_edit_handlers () {
  jQuery('div.zetaprints-page-input-fields input, div.zetaprints-page-input-fields textarea, div.zetaprints-page-input-fields select').mouseover(function() {
    highlight_shape_by_name(jQuery(this).attr('name').substring(12), get_current_shapes_container());
  }).mouseout(function() {
    dehighlight_shape_by_name(jQuery(this).attr('name').substring(12), get_current_shapes_container());
  });

  jQuery('div.zetaprints-images-selector').mouseover(function () {
    highlight_shape_by_name(jQuery(this).attr('rel').substring(12), get_current_shapes_container());
  }).mouseout(function () {
    if (!jQuery(this).children('div.fieldbox').length)
      dehighlight_shape_by_name(jQuery(this).attr('rel').substring(12), get_current_shapes_container());
  });

  jQuery('img#fancybox-img').live('click', function () {
    jQuery('div.zetaprints-field-shape.bottom', jQuery('div#fancybox-content')).removeClass('highlighted');

    popdown_field_by_name(undefined, true);
  });

  var fancybox_center_function = jQuery.fancybox.center;
  jQuery.fancybox.center = function () {
    var orig_position = jQuery('div#fancybox-wrap').position();

    fancybox_center_function();

    var new_position = jQuery('div#fancybox-wrap').position();

    if (orig_position.top != new_position.top
      || orig_position.left != new_position.left)
      popup_field_by_name(popdown_field_by_name());
  }
}

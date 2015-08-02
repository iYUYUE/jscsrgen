// Generated by CoffeeScript 1.9.3
$(function() {
  var btnDownload, btnGenerate, contentCSR, downloadCSRBundle, form, formatCountry, generate, input, pem, runnable, sanitizeCommonName, showDone, txtStatus;
  form = $('#formCSR');
  txtStatus = $('#status');
  btnGenerate = $('#btnGenerate');
  btnDownload = $('#btnDownload');
  contentCSR = $('#contentCSR');
  input = $(".form-control", form);
  pem = {};
  runnable = typeof Worker !== void 0 && Blob !== void 0;
  if (runnable) {
    txtStatus.attr('class', 'alert alert-info').html('<p>Ready to generate your CSR.</p>');
  } else {
    txtStatus.attr('class', 'alert alert-danger').html('<p>Missing support of <strong>WebWorker</strong> or <strong>Blob</strong>, unable to generate CSR.</p>');
    input.attr("disabled", false);
    btnGenerate.attr('disabled', true);
    return;
  }
  formatCountry = function(country) {
    if (!country.id) {
      return country.text;
    }
    return ("<strong class=\"monospace\">" + country.id + "</strong> ") + country.text;
  };
  $("#countryName").select2({
    formatResult: formatCountry,
    formatSelection: formatCountry,
    esacpeMarkup: function(m) {
      return m;
    }
  });
  sanitizeCommonName = function(cn) {
    return cn.replace(/^http:\/\//, '').replace(/^https:\/\//, '').replace(/\./g, '_').replace(/^\*/, 'star').replace(/[^a-zA-Z0-9_\-]+/g, '');
  };
  downloadCSRBundle = function() {
    var cn, content, zip;
    cn = sanitizeCommonName($('#commonName').val());
    zip = new JSZip();
    zip.file(cn + ".key", pem["private"]);
    zip.file(cn + ".csr", pem.csr);
    content = zip.generate({
      type: 'blob'
    });
    return saveAs(content, cn + ".zip");
  };
  showDone = function() {
    contentCSR.text(pem.csr);
    return $('#modalDone').on('hide.bs.modal', function() {
      txtStatus.attr('class', 'alert alert-info').html('<p>Ready to generate your CSR.</p>');
      input.attr("disabled", false);
      pem = {};
      return contentCSR.text("");
    }).modal();
  };
  generate = function() {
    var worker;
    input.each(function() {
      var self;
      return self = $(this);
    });
    worker = new Worker("worker.js");
    worker.onmessage = function(e) {
      if (!e.data) {
        return;
      }
      switch (e.data.type) {
        case 'status':
          return txtStatus.html("<p>" + e.data.message + "</p>");
        case 'done':
          txtStatus.html("<p>Done.</p>");
          return showDone();
        case 'private':
          return pem["private"] = e.data.pem;
        case 'csr':
          return pem.csr = e.data.pem;
      }
    };
    return worker.postMessage({
      type: "start",
      workload: (function() {
        var ret;
        ret = {};
        input.each(function() {
          var self;
          self = $(this);
          return ret[self.attr('id')] = self.val().trim();
        });
        return ret;
      })()
    });
  };
  btnDownload.click(function(e) {
    downloadCSRBundle();
    return e.preventDefault();
  });
  input.change(function() {
    var self;
    self = $(this);
    if (self.val().trim() === "") {
      return self.parent().addClass('has-warning');
    } else {
      return self.parent().removeClass('has-warning');
    }
  });
  return form.submit(function(e) {
    var pass;
    e.preventDefault();
    pass = true;
    input.each(function() {
      var self;
      self = $(this);
      if (self.val().trim() === "") {
        self.parent().addClass('has-warning');
        self.focus();
        return pass = false;
      }
    });
    if (!pass) {
      return;
    }
    input.attr("disabled", true);
    return generate();
  });
});

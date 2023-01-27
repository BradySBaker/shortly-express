const parseCookies = (req, res, next) => {
  //Create cookiesObj
  //
  if (req.headers.cookie) {
    var cookies = req.headers.cookie.split(' ');
    cookies.forEach((cookie) => {
      //Split var curCookie = [shortlyid, cookieDetails]
      var cookieDetails = cookie.split('=');
      //Check cookieDetails for semiColon
      var key = cookieDetails[0];
      var value = cookieDetails[1];
      //If semiColon splice to end - 1
      if (value[value.length - 1] === ';') {
        value = value.slice(0, value.length - 1);
      }
      req._setCookiesVariable(key, value);
    });
  }
  next();
};

module.exports = parseCookies;
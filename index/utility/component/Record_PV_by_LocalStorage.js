/**
 * @author:Jacks Who
 * time:2015-12-12
 **/
var record_PV_by_LocalStorage = (function () {
  var entry        = function (pageName) {
    var objectPageInit = {
      pageView: 1,
      pageName: pageName
    }
    var objectAllPage  = {}
    //获取对应页面的json对象
    var objAllString   = localStorage.getItem('objectAllPage')
    if (objAllString) {
      //把字符串转换成JSON对象
      objectAllPage = JSON.parse(objAllString)
      if (objectAllPage[ pageName ]) {
        objectAllPage[ pageName ].pageView = Number(objectAllPage[ pageName ].pageView) + 1
      } else {
        objectAllPage[ pageName ] = objectPageInit
      }
    } else {
      objectAllPage[ pageName ] = objectPageInit
    }
    //将JSON对象转化成字符串
    objAllString = JSON.stringify(objectAllPage)
    localStorage.setItem('objectAllPage', objAllString)
    return objectAllPage[ pageName ].pageView
  }
  var HtmlPageView = function (pageName) {
    var pageView = getPageView(pageName)
    if (isNaN(pageView)) return pageView
    var div       = document.createElement('div')
    div.innerHTML = '<span>你已经用该浏览器访问此页面</span>' + pageView + '次'
    return div
  }
  var getPageView  = function (pageName) {
    var objAllString = localStorage.getItem('objectAllPage')
    if (objAllString) {
      //把字符串转换成JSON对象
      objectAllPage = JSON.parse(objAllString)
      if (objectAllPage[ pageName ]) {
        return objectAllPage[ pageName ].pageView
      } else {
        return 'the objectAllPage does not contain the pageName'
      }
    } else {
      //可能未记录为false
      return 'the objectAllPage is undefined'
    }
  }
  return {
    entry       : entry,
    HtmlPageView: HtmlPageView,
    getPageView : getPageView
  }
})()

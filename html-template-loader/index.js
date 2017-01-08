module.exports = function(source, map) {
    this.cacheable();

    //console.log("--------------html template loader-----------");
    //console.log(source);
    var tpl = "__only__: ";


    var prepareScript = "",
        meetPreScript = false,
        generateScript = "",
        meetGenerateScript = false;

    var onlyOneTpl = true;
    //表示是否仅仅只有tpl为'__only__'

    source.split(/\r?\n/).forEach(function(line){
        line = line.trim();
        if(!line.length){
            return;
        }
        var regArray = line.match(/<!--%([\w\d$]+)%-->/);
        //match a new template variable
        if(regArray){
            variable = regArray[1];
            tpl += "'',\n" + variable + ":";
            onlyOneTpl = false;
            /*
             此时得到如下的样式：
                "__only__: '',
                name:"
            */
        //prepare script start
        } else if(/<script\s+generate/.test(line)){
            prepareScript += line;
            meetPreScript = true;
            prepareScript = prepareScript.replace(/<script\s+generate[^>]*>/, "");
            if(line.indexOf("</script>") >= 0){
                meetPreScript = false;
                prepareScript = prepareScript.replace("</script>", "");
            }
        //prepare script end
        } else if(meetPreScript && line.indexOf("</script>") >= 0){
            prepareScript += line;
            meetPreScript = false;
            prepareScript = prepareScript.replace("</script>", "");
        } else if(meetPreScript){
            prepareScript += line;
        } else if(line.indexOf("<script>") >= 0){
            meetGenerateScript = true;
            //generateScript += line
            line = line.replace("<script>", "");
            if(line.indexOf("</script>") >= 0){
                line = line.replace("</script>", "");
                meetGenerateScript = false;
            }
            if(line.length){
                tpl += line + "+";
            }
        } else if(meetGenerateScript && line.indexOf("</script>") >= 0){
            meetGenerateScript = false;
            line = line.replace("</script>", "");
            if(line.length){
                tpl += line + "\n+";
            }
        } else if(meetGenerateScript){
            tpl += line + "+\n";
        } else {
            /*
             tpl=  "__only__: '',
                name:"
            此时如果line1='<div>',那么结果就是：
                "__only__: '',
                name:'<div>'+
                "
            代码line.replace(/'/g, "\\'")就是把单引号转化为双引号：
              '<div>'.replace(/'/g, "\\'")
              得到"<div>"
            注意：这里牵涉到引号逻辑，因为一开始最外面是双引号，所以如果你希望保留单引号那么久需要单独添加，不需要保留
                引号的地方直接采用双引号即可！
            */
            tpl += "'" + line.replace(/'/g, "\\'") + "'+\n";
        }
    });

    tpl += "''";
    if(onlyOneTpl){
        tpl = tpl.replace("__only__:", "");
        tpl = "var tpl = " + tpl;
    } else {
        tpl = tpl.replace("__only__: '',", "");
        tpl = "var tpl = {" + tpl + "}";
        //转化成为可以直接eval的字符串
    }
    map = {};
    source = "";
    var abc = 5;
    var exports = prepareScript + "\nmodule.exports = tpl";
    //如果没有处理script添加的那种模板，那么我们这里的prepareScript就是""空字符串
    return prepareScript + "\n" + tpl + "\nmodule.exports = tpl";

}

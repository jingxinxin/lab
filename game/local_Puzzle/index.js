/*
* puzzleGame.js
* based on mootools
* by liangzhu
* 2013-05-13
*/

(function($) {
    var puzzleConfig = {
        sizeX: 3,
        sizeY: 3
    };

    //全局常量
    var Constants={
        //每一片拼图透明度较低时候的透明度值
        fadeOpacity: 0.8,
        //放拼图元素的水平方向padding+border的合计值，用于载入拼图后控制容器尺寸
        puzzleContainerExtra: 42
    };

    //图片相关变量
    var puzzleImage=null,
    imageURL="",
    //图片上传标识，为true时表示相关设置合理，选择图片后将进入游戏
    checkFlag=false,
    imageWidth=0,
    imageHeight=0;

    //拼图相关变量
    var puzzleWidth=0,
    puzzleHeight=0,
    puzzleItemWidth=0,
    puzzleItemHeight=0,
    puzzleSizeX=0,
    puzzleSizeY=0,
    //拼图数目
    puzzleNumber=0,
    //计数器，计算从开始到完成游戏用的步数
    moveStepCount=0,
    //拼图步数以及是否完成的提示文字
    puzzleNote=null,
    //保存每一片拼图的正确的坐标值的数组
    validPosArrayX=[],
    validPosArrayY=[],
    //保存每一片拼图的数组，索引顺序和正确的拼图顺序相同
    puzzleArray = [],
    //整个拼图元素本身
    puzzle=null,
    //最终放置该拼图的父元素节点
    puzzleSetElem=null;

    //初始第一步，读取拼图设置和图片源，包括对填写内容的验证*/
    var puzzleConfigSet = function() {
        //类名常量
        var sizeInputClassName = "size_input",
            noteWarnClassName = "note_warn",
            currentProgressClassName = "current_progress",
            validImageSuffix = ".jpg|.jpeg|.gif|.bmp|.png";

        //放置拼图的由外层变量保存的元素
        puzzleSetElem=$ ("puzzleSet");

        //取得对应元素
        var sizeXElem = $("sizeX"),
            sizeYElem = $("sizeY"),
            sizeSetNote = $("sizeSetNote"),
            uploadBtn = $("uploadBtn"),
            fileImage = $("fileImage"),
            uploadProgress = $("uploadProgress"),
            currentProgress = uploadProgress.getFirst("." + currentProgressClassName),
            uploadNote = $("uploadNote");

        //拼图尺寸设定检查
        var puzzleSizeCheck = function() {
            var sizeX = sizeXElem.value,
                sizeY = sizeYElem.value,
                numberReg = /^\d{1,2}$/;
            if (numberReg.test(sizeX) && numberReg.test(sizeY)) {
                if (sizeX >= 2 && sizeX <= 10 && sizeY >= 2 && sizeY <= 10) {
                    puzzleConfig.sizeX = sizeX;
                    puzzleConfig.sizeY = sizeY;
                    checkFlag = true;
                } else {
                    sizeSetNote.addClass(noteWarnClassName);
                }
            } else {
                sizeSetNote.addClass(noteWarnClassName);
            }
        };

        //图片尺寸检查
        var imageCheck = function(image) {
            var minWidth = 30,
                maxWidth = 850,
                minHeight = 30;
            if (image.width >= 30 && image.width <= 850 && image.height > 30) {
                checkFlag = checkFlag && true;
            } else {
                uploadNote.addClass(noteWarnClassName);
                checkFlag = false;
            }
        };

        //图片格式检查
        var formatCheck = function(image) {
            var fileURL = fileImage.value.toLowerCase();
            //获取文件拓展名
            formatSuffix = fileURL.substring(fileURL.lastIndexOf("."));
            if (formatSuffix&&validImageSuffix.contains(formatSuffix)) {
                //如果是正确格式的图片文件
                checkFlag = checkFlag && true;
            } else {
                alert("请上传正确格式的图片文件（" + validImageSuffix + "）");
                checkFlag = false;
            }
        };

        //拼图尺寸输入框的事件
        $$("." + sizeInputClassName).addEvent("focus", function() {
            sizeSetNote.removeClass(noteWarnClassName);
        });

        //读取选择上传的图片
        puzzleImage = new Image();
        puzzleImage.onload = function() {
            imageCheck(puzzleImage);
            if (checkFlag) {
                imageWidth = puzzleImage.width;
                //由于图片尺寸不一定能被拼图尺寸整除，因此做边缘裁剪
                while(imageWidth % puzzleConfig.sizeX != 0){
                    imageWidth--;
                }
                imageHeight = puzzleImage.height;
                while(imageHeight % puzzleConfig.sizeY != 0){
                    imageHeight--;
                }
                imageURL= puzzleImage.src;
                puzzleSetElem.empty();
                var containerWidth = imageWidth+Constants.puzzleContainerExtra,
                properContainerWidth = containerWidth>120?containerWidth:120;
                puzzleSetElem.getParent().setStyles({
                    width: properContainerWidth
                });
                createPuzzle(); //创建拼图
            }
            else{
                //如果读取后图片尺寸不合适的话，重置图片上传
                uploadProgress.style.display = "none";
                currentProgress.setStyle("width", 0);
                uploadBtn.style.display = "";
            }
        };
        if (typeof FileReader == "undefined") {
            //如果是不支持File API的浏览器
            fileImage.onchange = function() {
                puzzleSizeCheck();
                if (checkFlag) {
                    formatCheck();
                }
                if (checkFlag) {
                    puzzleImage.src =  fileImage.value;
                }
            };
        } else {
            //如果支持File API，可以显示读取进度条
            var imageReader = new FileReader();

            //对象URL（blob URL），经测试新版Chrome也支持window.URL
            function createObjectURL(blob){
                if(window.URL){
                    return window.URL.createObjectURL(blob);
                }else if(window.webkitURL){
                    return window.webkitURL.createObjectURL(blob);
                }else{
                    return null;
                }
            }
            //开始读取
            imageReader.onloadstart = function() {
                puzzleSizeCheck();
                if(checkFlag){
                    formatCheck();
                }
                if (checkFlag) {
                    uploadBtn.style.display = "none";
                    uploadProgress.style.display = "";
                }
            };
            //读取中
            imageReader.onprogress = function(event) {
                if (checkFlag) {
                    var percentage = 100 * parseInt(event.loaded / event.total) + "%";
                    currentProgress.setStyle("width", percentage);
                }
            };
            imageReader.onload = function(event) {
                if (checkFlag) {
                        //IE10也支持blob URL
                        var url=createObjectURL(fileImage.files[0]);
                        puzzleImage.src = url;
                }
            };
            fileImage.onchange = function() {
                imageReader.readAsDataURL(fileImage.files[0]);
            };
        }
    };

    //用于创建拼图
    var createPuzzle = function() {
            //classNameSet表示生成的元素的class名
            var classNameSet = {
                listContainer: "puzzle_container",
                list: "puzzle_list",
                item: "puzzle_item"
            };
            //各类元素对应的基本样式
            var puzzleStyle = {
                listContainer: {
                    position: "relative",
                    width: imageWidth,
                    height: imageHeight,
                    margin: "0 auto"
                },
                list: {

                },
                item: {
                    position: "absolute"
                }
            };
            //计算得到每一块拼图的尺寸
            puzzleSizeX = puzzleConfig.sizeX;
            puzzleSizeY = puzzleConfig.sizeY;
            puzzleWidth = imageWidth;
            puzzleHeight = imageHeight;
            puzzleItemWidth = puzzleWidth / puzzleSizeX;
            puzzleItemHeight = puzzleHeight / puzzleSizeY;
            puzzleNumber = puzzleSizeX * puzzleSizeY;

            //建立一个临时数组，用于生成随机顺序的拼图块
            var randomOrderPuzzleArray=[];

            //创建元素
            puzzle = elementsCreate();
            showAnime();

            //创建整个拼图的dom，返回最外层的父级元素
            function elementsCreate() {
                var listContainer = new Element("div");
                listContainer.addClass(classNameSet.listContainer);
                listContainer.setStyles(puzzleStyle.listContainer);

                var list = new Element("ul");
                list.addClass(classNameSet.list);
                list.setStyles(puzzleStyle.list);

                //先通过循环，创建每一个拼图块，并按正确顺序存入数组
                for(var i = 0, len = puzzleNumber; i < len; i++) {
                    var item = new Element("li");
                    //为每块拼图保存自身的正确索引
                    var indexSet = i + 1;
                    item.store("puzzleIndex", indexSet);
                    item.addClass(classNameSet.item);
                    //增加基本样式
                    item.setStyles(puzzleStyle.item);

                    //以正确顺序保存每一个拼图块到数组
                    puzzleArray.push(item);
                }

                //建立一个正确顺序数组的副本
                var puzzleArrayClone=puzzleArray.clone();

                //再次通过循环，创建一个乱序的拼图数组，并把这个数组显示到页面中
                for (i = 0, len = puzzleNumber; i < len; i++) {
                    var randomItem = puzzleArrayClone.getRandom();
                    //为避免重复，需要把被取出来的元素在副本数组中删除
                    puzzleArrayClone.erase(randomItem);

                    //为每一块取出来的元素设置可变的位置索引
                    var posIndex = i + 1;
                    randomItem.posIndex = posIndex;

                    //获取取出来的元素的正确索引，用于接下来计算拼图背景图位置
                    var correctIndex = randomItem.retrieve("puzzleIndex");

                    //计算位置
                    var topSet = Math.floor((posIndex - 1) / puzzleSizeX) * puzzleItemHeight,
                        leftSet = (posIndex - 1) % puzzleSizeX * puzzleItemWidth,

                        //计算符合正确索引的背景图位置
                        backgroundSetX = -(correctIndex - 1) % puzzleSizeX * puzzleItemWidth,
                        backgroundSetY = -(Math.floor((correctIndex - 1) / puzzleSizeX) * puzzleItemHeight),
                        backgroundString = "url(" + imageURL + ") " + backgroundSetX + "px " + backgroundSetY + "px " + "no-repeat";

                    //添加关键样式
                    randomItem.setStyles({
                        width: Math.ceil(puzzleItemWidth),
                        height: Math.ceil(puzzleItemHeight),
                        background: backgroundString,
                        left: leftSet,
                        top: topSet,
                        zIndex: posIndex
                    });

                    //生成合理的位置坐标数组
                    validPosArrayX.push(leftSet);
                    validPosArrayY.push(topSet);

                    //存放乱序元素到乱序数组
                    randomOrderPuzzleArray.push(randomItem);
                }

                //组合拼图的各个元素
                list.adopt(randomOrderPuzzleArray);
                listContainer.adopt(list);

                return listContainer;
            }

            //为拼图的初始化创建动画
            function showAnime(){
                //一些动画参数
                var timeSpace=50,
                //垂直移动的间距
                distance=30,
                 //计数用
                count=0,
                timeFlag;

                //所有拼图先隐藏，透明度置为0
                for(var i=0,len=puzzleArray.length;i<len;i++){
                    puzzleArray[i].setStyle("opacity",0);
                }

                //更新到页面dom中，准备开始动画
                puzzleSetElem.grab(puzzle);

                var enterFrameHandler=function(){
                    var puzzleItem=randomOrderPuzzleArray[count++];
                    var endTop=parseInt(puzzleItem.getStyle("top"));
                    var startTop=endTop-distance;

                    puzzleItem.set("morph",{
                        transition: Fx.Transitions.Quad.easeOut
                    });
                    puzzleItem.morph({
                        top:[startTop,endTop],
                        opacity:Constants.fadeOpacity
                    });

                    if(count<puzzleNumber){
                        //对最后一个拼图块的动画结束做侦听
                        if(count==puzzleNumber-1){
                            var lastMorph=puzzleItem.get("morph");
                            var showAnimeEnd=function(){
                                lastMorph.removeEvent("complete",showAnimeEnd);
                                puzzleEventBind();
                            }
                            lastMorph.addEvent("complete",showAnimeEnd);
                        }
                        timeFlag=setTimeout(enterFrameHandler,timeSpace);
                    }
                };
                timeFlag=setTimeout(enterFrameHandler,timeSpace);
            }

        };

    //拼图的相关事件绑定，也是游戏的核心控制逻辑
    var puzzleEventBind=function(){
        //拼图游戏控制相关的变量
        var selectedItem=null,
        //当前选中的拼图位置索引
        selectedIndex=0,
        //用于保存当前鼠标正在拖动的拼图的zIndex值
        selectedItemZIndex=0,
        //每一次切换拼图位置的时候，都涉及到2块拼图，鼠标拖动的这块和交换位置的另外一块，这个就是另外一块
        relatedItem=null,
        //依照鼠标当前的位置，判断得到的目标索引，如果鼠标此时放开，就是说把选中的拼图移到现在鼠标所在的位置
        targetIndexNew=0,
        //通过new和old来区分鼠标从一个目标索引更换到另一个目标索引
        targetIndexOld=0,
        //判断是否进行一次拼图位置移动的逻辑值，只有当目标索引值有改变时，才允许进行拼图位置移动
        isTargetIndexChanged=false,
        //判断鼠标指针是否在拼图的区域之内
        isInsidePuzzle=false,
        //鼠标点击拼图的某一个点的时候，距离拼图的左上角定位点有的距离值
        disX=0,
        disY=0;

        //计算获取整个拼图的左上角点的坐标
        var puzzlePos=puzzle.getPosition();
        var puzzlePosX=puzzlePos.x,
        puzzlePosY=puzzlePos.y;

        //重新设置每一个元素的动画速度
        (function(){
            for(var i=0,len=puzzleArray.length;i<len;i++){
                var puzzleItem=puzzleArray[i];
                puzzleItem.set("morph",{
                    duration:250
                });
            }
        })();

        //计数函数准备
        var updateCount = (function(){
            var stepCount = $("stepCount");
            puzzleNote = stepCount.getParent();
            return function(){
                stepCount.set("text", moveStepCount);
            };
        })();

        //添加事件
        puzzle.addEvent("mouseover",mouseOverHandler);
        puzzle.addEvent("mouseout",mouseOutHandler);
        puzzle.addEvent("mousedown",mouseDownHandler);
        puzzle.addEvent("mouseup",mouseUpHandler);

        //鼠标经过
        function mouseOverHandler(event){
            var target=event.target;
            if(puzzleArray.contains(target)){
                target.setStyle("opacity",1);
            }
        }

        //鼠标移出
        function mouseOutHandler(event){
            var target=event.target;
            if(puzzleArray.contains(target)){
                target.setStyle("opacity",Constants.fadeOpacity);
            }
        }

        //鼠标按下
        function mouseDownHandler(event){
            var target=event.target;
            //race("[mouseDownHandler]selectedItem ="+selectedItem);
            //如果当前没有其他目标选中，且鼠标选中的目标是拼图块
            if(!selectedItem&&puzzleArray.contains(target)){
                if(target.getStyle("opacity")<1){
                    target.setStyle("opacity",1);
                }

                //设置当前选中的目标及索引
                selectedItemZIndex=target.getStyle("zIndex");
                target.setStyle("zIndex",5000);
                selectedItem=target;
                selectedIndex=target.posIndex;

                //设置初始目标索引
                targetIndexNew=targetIndexOld=selectedIndex;

                //计算出鼠标点击的点和拼图左上角定位点的偏差距离
                var targetPos=target.getPosition();
                disX=event.page.x-targetPos.x;
                disY=event.page.y-targetPos.y;

                //增加鼠标移动的事件侦听，让拼图块跟随鼠标移动，并判断当前位置
                document.addEvent("mousemove",mouseMoveHandler);
            }
        }

        //鼠标松开
        function mouseUpHandler(event){
            //如果有元素处于拖动状态，取消
            if(selectedItem){
                selectedItem.setStyle("opacity",Constants.fadeOpacity);
                selectedItem.setStyle("zIndex",selectedItemZIndex);
                document.removeEvent("mousemove",mouseMoveHandler);

                //松开之后，根据目标索引和拖动元素的索引，移动拼图，并更新dom结构
                if(isInsidePuzzle){
                    //如果目标索引是一块别的拼图
                    if(targetIndexNew!=selectedIndex){
                        puzzleItemMove(selectedItem,targetIndexNew,puzzleItemSwitch);
                    }else{
                        //还原回原来的位置
                        puzzleItemMove(selectedItem,selectedIndex);
                        selectedItem=null;
                        relatedItem=null;
                    }
                }else{
                    //如果鼠标在拼图之外的区域松开，则被拖动的拼图还原回原来的位置
                    puzzleItemMove(selectedItem,selectedIndex);
                    selectedItem=null;
                    relatedItem=null;
                    targetIndexNew = targetIndexOld = selectedIndex;
                }
            }
        }

        //鼠标移动
        function mouseMoveHandler(event){
            var mouseX=event.page.x,
            mouseY=event.page.y;

            event.preventDefault();

            //设置选中元素的位置，跟随鼠标
            selectedItem.setPosition({
                x:mouseX-disX-puzzlePosX,
                y:mouseY-disY-puzzlePosY
            })

            //计算鼠标当前位置是否在拼图区域之内（拼图边缘也算在外）
            isInsidePuzzle=(function(){
                if(mouseX<=puzzlePosX||mouseX-puzzlePosX>=puzzleWidth){
                    return false;
                }
                if(mouseY<=puzzlePosY||mouseY-puzzlePosY>=puzzleHeight){
                    return false;
                }
                return true;
            })();

            //如果鼠标当前位置在拼图区域之内，再做目标索引计算
            if(isInsidePuzzle){
                //race("[mouseMoveHandler]isInsidePuzzle = true");

                //计算目标索引,xIndex和yIndex分别表示当前位置所处的列序号和行序号
                var xIndex=Math.ceil((mouseX-puzzlePosX)/puzzleItemWidth),
                yIndex=Math.ceil((mouseY-puzzlePosY)/puzzleItemHeight);
                targetIndexNew=(yIndex-1)*puzzleSizeX+xIndex;

                if(targetIndexNew!=targetIndexOld){
                    isTargetIndexChanged=true;
                }
                //只有当目标索引发生改变时，才移动拼图做示意
                if(isTargetIndexChanged){
                    //如果上一个目标索引的拼图不是鼠标正在移动的这个，那么就需要恢复这张拼图的位置到它原来的地方
                    if(targetIndexOld!=selectedIndex){
                        var lastRelatedItemIndex=relatedItem.posIndex;
                        puzzleItemMove(relatedItem,lastRelatedItemIndex);
                    }

                    //更新相关元素，取得拼图数组中posIndex等于当前的目标索引的元素
                    relatedItem=puzzleArray.filter(function(item, index){
                        return item.posIndex == targetIndexNew;
                    })[0];
                    //如果下一个目标索引，不是被拖走的拼图原来所在的位置，就移动新的目标索引的拼图到被拖走的拼图的位置
                    if(targetIndexNew!=selectedIndex){
                        puzzleItemMove(relatedItem,selectedIndex);
                    }

                    //重置目标索引改变的逻辑值
                    isTargetIndexChanged=false;

                    //更新上一个目标索引
                    targetIndexOld=targetIndexNew;
                }
            }else{
                //如果移到拼图区域之外，则考虑还原上一个目标索引的拼图
                if(targetIndexOld!=selectedIndex){
                        var lastRelatedItemIndex=relatedItem.posIndex;
                        puzzleItemMove(relatedItem,lastRelatedItemIndex);
                }
                //还原targetIndexOld的值，以处理移到拼图外的情况。
                targetIndexOld = selectedIndex;
            }
        }

        //每一次拼图交换的功能实现的函数，更改对应元素的posIndex，并更改zIndex
        function puzzleItemSwitch(){

            //交换元素的posIndex
            selectedItem.posIndex=targetIndexNew;
            relatedItem.posIndex=selectedIndex;

            //交换元素的zIndex，通过posIndex来赋值
            selectedItem.setStyle("zIndex",selectedItem.posIndex);
            relatedItem.setStyle("zIndex",relatedItem.posIndex);

            //清除对相关元素的引用
            selectedItem=null;
            relatedItem=null;

            //一次更换完成，计数器+1
            moveStepCount++;
            updateCount();

            //然后再判断拼图游戏是否完成
            clearJudgement();
        }

        //每一块拼图在游戏中的移动函数
        function puzzleItemMove(moveItem,moveToIndex,endFn){
            var moveToX=validPosArrayX[moveToIndex-1],
            moveToY=validPosArrayY[moveToIndex-1],
            originZIndex=moveItem.posIndex;
            moveItemMorph=moveItem.get("morph");
            moveItemMorph.addEvent("start",moveStartHandler);
            moveItemMorph.addEvent("complete",moveEndHandler);
            moveItem.morph({
                        left:moveToX,
                        top:moveToY
            });
            function moveStartHandler(){
                moveItem.setStyle("zIndex",1000);
            }
            function moveEndHandler(){
                moveItemMorph.removeEvent("start",moveStartHandler);
                moveItemMorph.removeEvent("complete",moveEndHandler);
                moveItem.setStyle("zIndex",originZIndex);

                //结尾执行的函数，如果需要的话
                if(typeOf(endFn)=="function"){
                    endFn();
                }
            }
        }

        //完成拼图游戏的判定函数
        function clearJudgement(){
            //检查puzzleArray中的每一个元素的puzzleIndex和posIndex是否全部一致
            var isGameClear=puzzleArray.every(function(item, index){
                var puzzleIndex=item.retrieve("puzzleIndex");
                return item.posIndex==puzzleIndex;
            });

            if(isGameClear){
                clearShow();
            }
        }

        //确定完成拼图游戏后，执行的函数
        function clearShow(){
             //清除所有事件侦听
            puzzle.removeEvent("mouseover",mouseOverHandler);
            puzzle.removeEvent("mouseout",mouseOutHandler);
            puzzle.removeEvent("mousedown",mouseDownHandler);
            puzzle.removeEvent("mouseup",mouseUpHandler);

            var clearAnimeFlag=null,
            count=0;

            //按顺序点亮所有拼图的动画
            var enterFrameHandler=function(){
                var item=puzzleArray[count++];
                item.fade(1);
                if(count<puzzleNumber){
                    clearAnimeFlag=setTimeout(enterFrameHandler,50);
                }
            };

             clearAnimeFlag=setTimeout(enterFrameHandler,50);

            //游戏完成后的信息~❤
            puzzleNote.set('html','Congratulations ! Your final step count is <em class="step_count">'+moveStepCount+'</em>.');
        }
    }

    //创建全局变量puzzleGame
    window.puzzleGame={};

    //添加方法到全局变量puzzleGame中
    puzzleGame.start = function() {
        puzzleConfigSet();
    };

})(document.id);

puzzleGame.start();

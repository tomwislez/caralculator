$(document).ready(function() {
    //define global variables
    var settings;
    var caraStockData;


    function storeSettings(){   //A function to store settings.
        let settingsString = JSON.stringify(settings)
        localStorage.setItem("settings.json", settingsString)
        console.log("Settings saved!")
    }

    function loadSettings(){    //Load settings from local storage and fix issues of non existing values.
        let settingsJSON = localStorage.getItem("settings.json")
        try {
            settings = JSON.parse(settingsJSON);
        } catch (error){
            console.log(error);
            settings = {};    //if the json object is not parseable, it probably doesn't exist.
        } 
        if (settings == null){ //if the variable is null, make it an object.
            settings = {};
        }


        const defaultStoredSettings = {
            "lastViewTime": Date.now(),
            "caraPrice": 0.39,
            "carasPerHour": 3
        }


        settings = Object.fromEntries(
            Object.entries(defaultStoredSettings).map(([key, defaultValue]) => [    //loops over each key-value in defaultStoredSettings and wraps it back into an object.
              key, key in settings ? settings[key] : defaultValue,   //if that key exists in settings, use the value from settings. If it doesn't exist, fall back to default.
            ])
        );

        //DEFINE VARIABLES FROM SETTINGS, OR DEFAULT ONES FOR STARTUP.
        //caraPrice = settings.caraPrice;
        //carasToGetDrunk = settings.carasToGetDrunk; OBSOLETE: calling it from the settings object.

        console.log("Loaded Settings:", settings)
        $("#inputCarasPerHour").attr('placeholder', settings.carasPerHour);
        //storeSettings(); //if settings are loaded, save them again in browser.
    }

    function handleUserSaveCommand(userInput = 1){
        console.log(userInput)
        if (userInput < 1 || userInput == "") {
            alert("dwoazerik.")
            userInput = 1;
        } else {
            $("#inputCarasPerHour").val(null);
            $("#inputCarasPerHour").attr('placeholder', userInput);
            settings.carasPerHour = userInput;
            storeSettings();

        };

    }

    function getLatestPrice(data){
        //Find the latest price of cara
        //First loop through all keys and compare the date. Filtering out the latest date.
        let dataKeys = Object.keys(data);
        let latestDate = dataKeys[0];//store the first element in latestDate to start comparing
        dataKeys.forEach(element => {
            var date = new Date(element);
            if (date > new Date(latestDate)){
                latestDate = element;
            };
        });
        return data[latestDate];
    }
    function getEarliestPrice(data){
        //Find the latest price of cara
        //First loop through all keys and compare the date. Filtering out the latest date.
        let dataKeys = Object.keys(data);
        let earliestDate = dataKeys[0];//store the first element in latestDate to start comparing
        dataKeys.forEach(element => {
            var date = new Date(element);
            if (date < new Date(earliestDate)){
                earliestDate = element;
            };
        });
        return data[earliestDate];
    }





    async function getCaraPrice() {
        var today = new Date();
        
        fetch('./data/caraPrice.json?version=' + today)
        .then(response => {
            if (!response.ok) {
            throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            settings.caraPrice = getLatestPrice(data);
            console.log("Cara Price updated. Storing in settings... ", settings)
            caraStockData = data;
            storeSettings();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            console.error('Site is probably broken. Try refreshing or something or drink a cara or whatever.')
        });
    }

    function updateCaraStockPrice(chartview = "alltime"){

        getCaraPrice(); //update caraStockData
        //console.log(caraStockData)     
        let caraLabelsFull = Object.keys(caraStockData) //get all keys from caraStockData
        let caraLabels = [];
        let caraData = [];
        let selectedCaraStockData = [];
        let today = new Date()
        if (chartview == "year"){ //chosen view in chart is year

            caraLabelsFull.forEach(element =>{  //find all elements of this year
                if (element.substring(0,4) == today.getFullYear()){
                    caraLabels.push(element.substring(0,10));
                    caraData.push(caraStockData[element]);
                };
            });
        } else if (chartview == "month"){  //chosen view in chart is month
            caraLabelsFull.forEach(element =>{ //find all elements of this month
                if (element.substring(5,7) == today.getMonth() + 1){
                    caraLabels.push(element.substring(0,10));
                    caraData.push(caraStockData[element]);
                };
            });
        } else {    //Fall back to default: "alltime"
            caraLabelsFull.forEach(element =>{
                caraLabels.push(element.substring(0,10));
                caraData.push(caraStockData[element]);
            });

        };


        // Build selectedCaraStockData from chosen elements
        for (let index = 0; index < caraLabels.length; index++) {
            selectedCaraStockData[caraLabels[index]] = caraData[index];

        };

        // get earliest and latest price for further calculations
        let earliestCaraPrice = getEarliestPrice(selectedCaraStockData);
        let latestCaraPrice = getLatestPrice(selectedCaraStockData);


        // Calculate the stock price change 
        let caraStockPriceChange = Math.round((latestCaraPrice - earliestCaraPrice)*100) / 100;
        let caraStockPercentage = Math.round(((caraStockPriceChange / earliestCaraPrice)*100)*100) / 100;


        // Draw all info to page
        caraChart.data.labels = caraLabels;
        caraChart.data.datasets[0].data = caraData
        caraChart.update();


        $("#caraPrice").text(settings.caraPrice + " EUR");

        if (caraStockPriceChange < 0){
            $("#caraStockPriceChange").addClass("negativePrice")
            $("#caraStockPercentage").addClass("negativePrice")
            $("#caraStockPriceChange").text("- "  + Math.abs(caraStockPriceChange) + " EUR")
            $("#caraStockPercentage").text("(- " + Math.abs(caraStockPercentage) + "%)")
        }   else {
            $("#caraStockPriceChange").removeClass("negativePrice")
            $("#caraStockPercentage").removeClass("negativePrice")
            $("#caraStockPriceChange").text("+ " +  + caraStockPriceChange + " EUR")
            $("#caraStockPercentage").text("(+ " + caraStockPercentage + "%)")
        }
    }

    
    function getCalculation(userInput){
        
        if (userInput < 0 || userInput == "") {
            alert("dwoazerik.")
            userInput = 0;
        };
        //Calculate number of cara's you could buy.
        let numberOfCaras = Math.floor(Number(userInput) / settings.caraPrice);

        //Calculate how many hours you could drink.
        let totalHours = Math.floor(numberOfCaras/settings.carasPerHour);

        if (totalHours >= 24){
            totalDaysDrinking = Math.floor(totalHours / 24)
            totalHoursDrinking = totalHours - (totalDaysDrinking * 24)
        } else {
            totalDaysDrinking = 0;
            totalHoursDrinking = totalHours;
        }

        
        showCalculation(userInput, numberOfCaras, totalHoursDrinking, totalDaysDrinking);
       
        
    }


    function showCalculation(userInput = 0, numberOfCaras = 0, totalHoursDrinking = 0, totalDaysDrinking = 0){
        console.log("numberOfCaras: ", numberOfCaras)
        console.log("totalHoursDrinking: ", totalHoursDrinking)
        console.log("totalDaysDrinking: ", totalDaysDrinking)
        $(".output-block").slideUp(100, () =>{
            
            $("#input").val(null);
            $("#input").attr('placeholder', "");

            var output1Text;
            var output2Text;
            var output2TextNumber;
            var output1TextPart1;
            var output1TextPart2;
            if (numberOfCaras == 0){
                output1Text = "Met € " + userInput + " kan je geen enkele cara kopen, en dus ook niet zat zijn."
                output2TextNumber = 11;
            } else if (numberOfCaras == 1){
                output1Text = "Met € " + userInput + " kan je maar één cara kopen..."
                output2TextNumber = 12;
            } else {
                output1TextPart1 = "Met € " + userInput + " kan je " + numberOfCaras + " cara's kopen en "

                if (totalDaysDrinking == 0){
                    if (totalHoursDrinking == 0){
                        output1TextPart2 = "geen volledig uur doorkomen."
                    } else if (totalHoursDrinking == 1){
                        output1TextPart2 = "net een uur drinken.";
                    } else {
                        output1TextPart2 = totalHoursDrinking + " uur aan één stuk drinken."
                    }
                } else {
                    if (totalDaysDrinking == 1){
                        if (totalHoursDrinking == 0){
                            output1TextPart2 = "één volledige dag drinken."
                        } else {
                            output1TextPart2 = "één dag en " + totalHoursDrinking + " uur drinken."
                        }
                    } else {
                        output1TextPart2 = totalDaysDrinking + " dagen en " + totalHoursDrinking + " uur drinken."
                    }

                }
                output1Text = output1TextPart1 + output1TextPart2
                output2TextNumber = Math.floor(Math.random()* 10 ) //gives pseudo random number from 0-10
            }
           
            switch (output2TextNumber){
                case 0:
                    output2Text = "Godmiljaar dat gaat smaken."
                    break;
                case 1:
                    output2Text = "Njammie!"
                    break;
                case 2:
                    output2Text = "Hop naar de Colruyt!"
                    break;
                case 3:
                    output2Text = "Genieten van het gerstennat!"
                    break;
                case 4:
                    output2Text = "BLBLBLLBLLLLNJAAM!!! CAAARAAAA"
                    break;
                case 5:
                    output2Text = "Dat is cara trut!"
                    break;
                case 6:
                    output2Text = "Ook leuk om te geven als geschenk!"
                    break;
                case 7:
                    output2Text = "Pro tip: de ideale schenktemperatuur is tussen de 15°C - 20°C"
                    break;
                case 8:
                    output2Text = "Denk aan de natuur! Warm je cara op in de zon in plaats van in de oven."
                    break;
                case 9:
                    output2Text = numberOfCaras + " blikjes puur genot."
                    break;
                case 10:
                    output2Text = "Een betere investering kan je niet vinden."
                    break;
                case 11: //0 cara's
                    output2Text = "Amai das triest."
                    break;
                case 12: //1 cara
                    output2Text = "Op één been kan je niet staan. Hopelijk storten ze snel je uitkering."
                    break;
            }
            $("#output1").text(output1Text)          
            $("#output2").text(output2Text);            
            $(".output-block").slideDown();
        });
    }






    //Userinterface handlers
    //menu
    $(".menu-item-selectable").on('click', (event) => {
        $(event.currentTarget).addClass("selected");
        $(event.currentTarget).siblings().removeClass("selected");
    })

    $("#home-button").on('click', () => {
        $("#caralculator-page").removeClass("hidden");
        $("#caralove-page").addClass("hidden");
        $("#stock-page").addClass("hidden");
        $("#settings-page").addClass("hidden");
        
    })

    $("#heart-button").on('click', () => {
        $("#caralculator-page").addClass("hidden");
        $("#caralove-page").removeClass("hidden");
        $("#stock-page").addClass("hidden");
        $("#settings-page").addClass("hidden");
        
    })

    $("#stock-button").on('click', () => {
        updateCaraStockPrice();
        $("#caralculator-page").addClass("hidden");
        $("#caralove-page").addClass("hidden");
        $("#stock-page").removeClass("hidden");
        $("#settings-page").addClass("hidden");
        
    })
    
    $("#settings-button").on('click', () => {
        $("#caralculator-page").addClass("hidden");
        $("#caralove-page").addClass("hidden");
        $("#stock-page").addClass("hidden");
        $("#settings-page").removeClass("hidden");
        
    })

    //installbutton handled in main.js!!!

    $("#links-button").on('click', () => {
        window.open("https://www.sideprojects.schonesmoel.be", '_blank').focus()
    })

    $("#share-button").on('click', async () => {
        //share link
        const shareData = {
            title: "Caralculator",
            text: "Handige app voor budgetbeheer",
            url: "https://www.leutepreute.schonesmoel.be/caralculator/"
        }
        try {
            await navigator.share(shareData);
        } catch (err){
            console.err("error in trying to share data", err)
        }
        
    })

    $("#caralculate-button").on('click', () => {
        getCalculation($("#input").val());
    })

    $("#input").keypress(function(event){
        var code = (event.keyCode);
        //console.log(code);
        if (code == '13'){
            getCalculation($("#input").val());
        }
        
    })

    $("#save-button").on('click', () => {
        handleUserSaveCommand($("#inputCarasPerHour").val());
    })

    $("#inputCarasPerHour").keypress(function(event){
        var code = (event.keyCode);
        //console.log(code);
        if (code == '13'){
            handleUserSaveCommand($("#inputCarasPerHour").val());
        }
        
    })

    $("#caraChart-button1").on('click', () => {
        updateCaraStockPrice("alltime");
    })
    $("#caraChart-button2").on('click', () => {
        updateCaraStockPrice("year");
    })
    $("#caraChart-button3").on('click', () => {
        updateCaraStockPrice("month");
    })





    //CHART
    

    var caraChartGraphData = {
        labels: ["no Data"], datasets: [{
            label: 'CARA index',
            backgroundColor: 'rgb(255, 0, 0)',
            borderColor: 'rgb(255, 0, 0)',
            data: [0.39]
        }]
    }

    var caraChartGraphConfig = {
        type: 'line',
        data: caraChartGraphData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                beginAtZero: true,
                suggestedMax: 1
                }

            }
        }
    };

    const caraChart = new Chart (
        document.getElementById('caraChart'), caraChartGraphConfig

    ); 

   

    //Popup balloon
    function popupBalloonInstall (){
        let calculateFiveDaysAgo = (Date.now() - 432000000);
        if (settings.lastViewTime < calculateFiveDaysAgo ){
            $("#popup-balloon-install-button").animate({width:100}, { complete: setTimeout(function(){
                $("#popup-balloon-install-button").animate({width:0});
                }, 5000)
            });
            settings.lastViewTime = Date.now();
            storeSettings();
        }
    }
    
    function popupBalloonLinks (){
        let calculateFiveDaysAgo = (Date.now() - 432000000);
        if (settings.lastViewTime < calculateFiveDaysAgo ){
            $("#popup-balloon-links-button").animate({width:100}, { complete: setTimeout(function(){
                    $("#popup-balloon-links-button").animate({width:0});
                }, 5000)
            });
            settings.lastViewTime = Date.now();
            storeSettings();
        }
    }

    function popupBalloonShare (){
        let calculateFiveDaysAgo = (Date.now() - 432000000);
        if (settings.lastViewTime < calculateFiveDaysAgo ){
            $("#popup-balloon-share-button").animate({width:100}, { complete: setTimeout(function(){
                    $("#popup-balloon-share-button").animate({width:0});
                }, 5000)
            });
            settings.lastViewTime = Date.now();
            storeSettings();
        }
    }


    
    
















    //initialize all
    setTimeout(popupBalloonInstall, 1100)
    setTimeout(popupBalloonShare, 1000)
    loadSettings();
    getCaraPrice();
    //updateCaraStockPrice();

    




});

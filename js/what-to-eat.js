document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const drawButton = document.getElementById('draw-button');
    const drawButtonText = document.getElementById('draw-button-text');
    const selectedDishesContainer = document.getElementById('selected-dishes-container');
    const selectedDishesList = document.getElementById('selected-dishes-list');
    const shoppingListContainer = document.getElementById('shopping-list-container');
    const shoppingList = document.getElementById('shopping-list');
    const shoppingListRenderArea = document.getElementById('shopping-list-render-area');
    const shoppingListDate = document.getElementById('shopping-list-date');
    const clearButton = document.getElementById('clear-button');
    const generateImageBtn = document.getElementById('generate-image-btn');
    const initialPrompt = document.getElementById('initial-prompt');
    const imagePreviewModal = document.getElementById('image-preview-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const modalContent = imagePreviewModal.querySelector('div');

    // Data - Expanded Dish List
    const dishes = [
        // --- 绍兴菜 (Shaoxing Cuisine) ---
        { name: "绍兴醉鸡", ingredients: ["童子鸡", "绍兴黄酒", "枸杞", "生姜", "小葱"] },
        { name: "油焖春笋", ingredients: ["春笋", "生抽", "老抽", "冰糖", "食用油"] },
        { name: "茴香豆", ingredients: ["蚕豆", "茴香", "桂皮", "盐", "酱油"] },
        { name: "清蒸臭豆腐", ingredients: ["臭豆腐", "毛豆", "辣椒酱", "菜籽油"] },
        { name: "绍三鲜", ingredients: ["鱼丸", "猪肚", "鸡肉", "猪皮", "河虾", "黑木耳"] },
        { name: "糟溜鱼片", ingredients: ["草鱼", "酒酿", "蛋清", "淀粉", "黑木耳"] },
        { name: "绍兴酱鸭", ingredients: ["鸭子", "黄酒", "酱油", "葱", "姜"] },
        { name: "西施豆腐", ingredients: ["嫩豆腐", "猪肉末", "香菇", "鸡蛋", "淀粉"] },
        { name: "虾油露鸡", ingredients: ["鸡肉", "虾油", "黄酒", "葱", "姜"] },
        { name: "油炸臭豆腐", ingredients: ["臭豆腐", "甜面酱", "辣椒酱"] },
        { name: "醉蟹", ingredients: ["河蟹", "黄酒", "酱油", "糖", "生姜"] },
        { name: "柯桥豆腐", ingredients: ["老豆腐", "河虾", "肉末", "笋丁"] },
        { name: "安昌腊肠饭", ingredients: ["安昌腊肠", "米饭", "鸡蛋", "青豆", "酱油"] },
        { name: "酱爆螺蛳", ingredients: ["螺蛳", "豆瓣酱", "辣椒", "姜", "蒜"] },
        { name: "酒酿圆子", ingredients: ["酒酿", "糯米粉", "糖桂花"] },
        { name: "雪菜炒年糕", ingredients: ["年糕", "雪菜", "猪肉丝", "笋丝"] },
        { name: "肉末蒸蛋", ingredients: ["鸡蛋", "猪肉末", "葱花", "生抽"] },
        { name: "雪菜大黄鱼", ingredients: ["大黄鱼", "雪菜", "笋片", "姜"] },
        { name: "油浸蚕豆", ingredients: ["蚕豆", "葱", "食用油", "盐"] },
        { name: "梅菜扣肉", ingredients: ["五花肉", "梅干菜", "姜", "葱", "八角", "老抽", "生抽", "糖"] },
        { name: "绍兴醉虾", ingredients: ["河虾", "绍兴黄酒", "姜", "葱"] },

        // --- 粤菜 (Cantonese Cuisine) ---
        { name: "白切鸡", ingredients: ["三黄鸡", "姜", "葱", "姜蓉、葱油、生抽(蘸料)"] },
        { name: "咕噜肉", ingredients: ["猪里脊", "青椒", "红椒", "菠萝", "番茄酱", "白醋", "糖"] },
        { name: "豉汁蒸排骨", ingredients: ["排骨", "豆豉", "蒜", "辣椒", "淀粉"] },
        { name: "蜜汁叉烧", ingredients: ["猪梅花肉", "叉烧酱", "蜂蜜", "料酒", "生抽"] },
        { name: "咸鱼鸡粒豆腐煲", ingredients: ["咸鱼", "鸡肉", "豆腐", "香菇", "蚝油"] },
        { name: "啫啫鸡煲", ingredients: ["鸡块", "洋葱", "青红椒", "姜", "蒜", "柱侯酱"] },
        { name: "香芋蒸排骨", ingredients: ["排骨", "芋头", "豆豉", "蒜"] },
        { name: "豉油皇炒面", ingredients: ["鲜面条", "豆芽", "青菜", "葱", "生抽", "老抽"] },
        { name: "蒜蓉粉丝蒸扇贝", ingredients: ["扇贝", "龙口粉丝", "大蒜", "小米椒", "蒸鱼豉油"] },
        { name: "避风塘炒蟹", ingredients: ["大闸蟹", "蒜蓉", "干辣椒", "面包糠"] },
        { name: "豉汁蒸鱼", ingredients: ["鲈鱼", "豆豉", "姜", "葱", "蒸鱼豉油"] },
        { name: "干炒牛河", ingredients: ["牛肉", "河粉", "豆芽", "葱", "生抽", "老抽"] },

        // --- 湘菜 (Hunan Cuisine) ---
        { name: "农家小炒肉", ingredients: ["五花肉", "螺丝椒", "豆豉", "蒜", "酱油"] },
        { name: "剁椒鱼头", ingredients: ["鱼头", "剁辣椒", "姜", "蒜", "葱", "料酒"] },
        { name: "酸豆角炒肉末", ingredients: ["酸豆角", "猪肉末", "小米椒", "蒜"] },
        { name: "毛氏红烧肉", ingredients: ["五花肉", "糖", "八角", "桂皮", "干辣椒"] },
        { name: "辣椒炒肉", ingredients: ["猪里脊", "青椒", "红椒", "蒜", "酱油"] },
        { name: "口味虾", ingredients: ["小龙虾", "豆瓣酱", "干辣椒", "花椒", "姜", "蒜"] },
        { name: "湘西外婆菜炒腊肉", ingredients: ["湘西外婆菜", "腊肉", "青椒", "红椒", "蒜"] },
        { name: "辣椒炒鸡蛋", ingredients: ["鸡蛋", "青椒", "红椒", "蒜"] },
        { name: "湘味炒田螺", ingredients: ["田螺", "豆瓣酱", "姜", "蒜", "葱"] },

        // --- 淮扬菜 (Huaiyang Cuisine) ---
        { name: "狮子头", ingredients: ["猪肉末", "荸荠", "鸡蛋", "葱", "姜"] },
        { name: "清炖甲鱼", ingredients: ["甲鱼", "火腿", "姜", "葱", "料酒"] },
        { name: "扬州炒饭", ingredients: ["米饭", "鸡蛋", "虾仁", "火腿", "青豆", "玉米", "胡萝卜"] },
        { name: "三套鸭", ingredients: ["老鸭", "母鸭", "小鸭", "火腿", "香菇", "姜"] },
        { name: "文思豆腐羹", ingredients: ["嫩豆腐", "鸡蛋清", "火腿", "鸡汤", "淀粉"] },
        { name: "清炖蟹粉狮子头", ingredients: ["猪肉末", "蟹粉", "荸荠", "鸡蛋", "葱"] },
        { name: "盐水鸭", ingredients: ["鸭子", "葱", "姜", "花椒", "八角", "桂皮"] },

        // --- 东北菜 (Northeastern Cuisine) ---
        { name: "小鸡炖蘑菇", ingredients: ["鸡块", "干蘑菇", "粉条", "葱", "姜", "八角"] },
        { name: "猪肉炖粉条", ingredients: ["五花肉", "粉条", "酸菜", "姜", "八角"] },
        { name: "东北乱炖", ingredients: ["排骨", "土豆", "玉米", "豆角", "番茄", "茄子"] },
        { name: "溜肉段", ingredients: ["猪里脊", "青椒", "胡萝卜", "淀粉", "酱油"] },
        { name: "锅包肉", ingredients: ["猪里脊", "土豆淀粉", "姜丝", "葱丝", "胡萝卜丝", "糖、醋、生抽(酱汁)"] },
        { name: "地三鲜", ingredients: ["土豆", "茄子", "青椒", "蒜末", "生抽", "蚝油", "糖", "淀粉"] },
        { name: "酸菜白肉锅", ingredients: ["五花肉", "酸菜", "粉条", "豆腐", "姜", "葱"] },
        { name: "铁锅炖大鹅", ingredients: ["大鹅", "土豆", "玉米", "豆角", "葱", "姜"] },

        // --- 鲁菜 (Shandong Cuisine) ---
        { name: "九转大肠", ingredients: ["猪大肠", "姜", "葱", "蒜", "干辣椒", "花椒"] },
        { name: "糖醋鲤鱼", ingredients: ["鲤鱼", "番茄酱", "白醋", "糖", "姜", "葱"] },
        { name: "葱烧海参", ingredients: ["海参", "大葱", "姜", "鸡汤", "生抽"] },
        { name: "德州扒鸡", ingredients: ["童子鸡", "八角", "桂皮", "香叶", "花椒"] },
        { name: "四喜丸子", ingredients: ["猪肉末", "荸荠", "鸡蛋", "香菇", "青豆"] },
        { name: "拔丝地瓜", ingredients: ["红薯", "白糖", "水"] },
        { name: "锅塌豆腐", ingredients: ["老豆腐", "鸡蛋", "淀粉", "葱", "姜", "生抽"] },

        // --- 川菜 (Sichuan Cuisine) ---
        { name: "干锅土豆片", ingredients: ["土豆", "五花肉", "洋葱", "青椒", "干辣椒", "郫县豆瓣酱"] },
        { name: "麻婆豆腐", ingredients: ["嫩豆腐", "猪肉末", "郫县豆瓣酱", "花椒粉", "蒜末", "姜末", "小葱", "水淀粉"] },
        { name: "宫保鸡丁", ingredients: ["鸡胸肉", "花生米", "干辣椒", "花椒", "葱", "姜", "蒜", "醋、糖、生抽、料酒、淀粉(酱汁)"] },
        { name: "鱼香肉丝", ingredients: ["猪里脊", "黑木耳", "胡萝卜", "青椒", "泡椒", "蒜末", "姜末", "葱花", "醋、糖、生抽、料酒、淀粉(酱汁)"] },
        { name: "回锅肉", ingredients: ["五花肉", "青蒜", "郫县豆瓣酱", "豆豉", "姜片", "料酒"] },
        { name: "水煮肉片", ingredients: ["猪里脊", "豆芽", "青菜", "干辣椒", "花椒", "郫县豆瓣酱", "蛋清", "淀粉"] },
        { name: "辣子鸡", ingredients: ["鸡腿肉", "干辣椒", "花椒", "芝麻", "姜", "蒜"] },
        { name: "酸菜鱼", ingredients: ["草鱼", "酸菜", "泡椒", "干辣椒", "花椒", "蛋清", "淀粉"] },
        { name: "口水鸡", ingredients: ["鸡腿", "花生碎", "芝麻", "辣椒油", "花椒油", "葱", "姜", "蒜"] },
        { name: "夫妻肺片", ingredients: ["牛肉", "牛杂", "花生碎", "香菜", "芹菜", "红油辣子", "花椒粉"] },
        { name: "铁板豆腐", ingredients: ["老豆腐", "五花肉", "青椒", "红椒", "洋葱", "蒜末", "姜末", "葱花", "生抽", "蚝油"] },
        { name: "干锅花菜", ingredients: ["花菜", "五花肉", "洋葱", "青椒", "干辣椒", "郫县豆瓣酱"] },
        { name: "蒜泥白肉", ingredients: ["五花肉", "黄瓜", "大蒜", "姜片", "辣椒油", "生抽", "醋", "糖"] },
        { name: "麻辣香锅", ingredients: ["任意食材", "午餐肉", "藕片", "西兰花", "虾", "麻辣香锅底料", "干辣椒", "花椒"] },
        { name: "泡椒凤爪", ingredients: ["鸡爪", "泡椒", "姜", "蒜", "花椒"] },
        { name: "蒜香排骨", ingredients: ["排骨", "大蒜", "生姜", "葱", "生抽", "老抽", "糖"] },
        { name: "干锅牛蛙", ingredients: ["牛蛙", "洋葱", "青红椒", "干辣椒", "花椒", "姜", "蒜", "郫县豆瓣酱"] },
        { name: "水煮牛肉", ingredients: ["牛肉片", "豆芽", "青菜", "干辣椒", "花椒", "郫县豆瓣酱", "蛋清", "淀粉"] },

        // --- 其他常见家常菜 (Other Home-style Dishes) ---
        { name: "罗宋汤", ingredients: ["牛肉", "番茄", "土豆", "胡萝卜", "洋葱", "卷心菜", "番茄酱"] },
        { name: "咖喱鸡", ingredients: ["鸡腿肉", "土豆", "胡萝卜", "洋葱", "咖喱块", "椰浆"] },
        { name: "香煎三文鱼", ingredients: ["三文鱼", "芦笋", "柠檬", "黑胡椒", "盐"] },
        { name: "蒜蓉开背虾", ingredients: ["大虾", "粉丝", "蒜", "小米椒", "生抽"] },
        { name: "清炖狮子头", ingredients: ["猪肉末", "马蹄", "鸡蛋", "青菜", "姜"] },
        { name: "丝瓜炒鸡蛋", ingredients: ["丝瓜", "鸡蛋", "蒜", "盐"] },
        { name: "黄焖鸡", ingredients: ["鸡腿肉", "香菇", "青椒", "姜", "生抽", "蚝油"] },
        { name: "大盘鸡", ingredients: ["鸡块", "土豆", "青椒", "皮带面", "干辣椒", "花椒", "郫县豆瓣酱"] },
        { name: "香菇滑鸡", ingredients: ["鸡腿肉", "干香菇", "姜", "枸杞", "生抽"] },
        { name: "豆角焖面", ingredients: ["鲜面条", "豆角", "五花肉", "蒜", "酱油"] },
        { name: "油豆腐塞肉", ingredients: ["油豆腐", "猪肉末", "香菇", "葱"] },
        { name: "苦瓜酿肉", ingredients: ["苦瓜", "猪肉末", "虾米", "香菇"] },
        { name: "金沙玉米", ingredients: ["甜玉米粒", "咸蛋黄", "淀粉"] },
        { name: "红烧肉", ingredients: ["五花肉", "大葱", "生姜", "八角", "冰糖", "料酒", "生抽", "老抽"] },
        { name: "糖醋里脊", ingredients: ["猪里脊", "鸡蛋", "淀粉", "番茄酱", "白醋", "糖"] },
        { name: "可乐鸡翅", ingredients: ["鸡中翅", "可乐", "生姜", "料酒", "生抽", "老抽"] },
        { name: "番茄炒蛋", ingredients: ["番茄", "鸡蛋", "小葱", "盐", "糖"] },
        { name: "酸辣土豆丝", ingredients: ["土豆", "干辣椒", "花椒", "青椒", "白醋", "盐"] },
        { name: "干煸四季豆", ingredients: ["四季豆", "猪肉末", "干辣椒", "花椒", "芽菜"] },
        { name: "青椒肉丝", ingredients: ["猪里脊", "青椒", "姜", "蒜", "生抽", "淀粉"] },
        { name: "木须肉", ingredients: ["猪里脊", "鸡蛋", "黑木耳", "黄瓜", "黄花菜", "葱", "姜"] },
        { name: "肉末茄子", ingredients: ["长茄子", "猪肉末", "蒜", "姜", "郫县豆瓣酱", "生抽", "蚝油"] },
        { name: "京酱肉丝", ingredients: ["猪里脊", "大葱", "甜面酱", "蛋清", "淀粉", "豆腐皮"] },
        { name: "清炒西兰花", ingredients: ["西兰花", "胡萝卜", "蒜瓣", "盐", "蚝油"] },
        { name: "手撕包菜", ingredients: ["包菜", "干辣椒", "花椒", "蒜片", "陈醋", "生抽"] },
        { name: "蚝油生菜", ingredients: ["生菜", "蒜蓉", "蚝油", "生抽", "糖"] },
        { name: "虎皮青椒", ingredients: ["青椒", "豆豉", "蒜", "醋", "糖", "生抽"] },
        { name: "白灼菜心", ingredients: ["菜心", "蒜", "姜", "生抽", "食用油"] },
        { name: "韭菜炒鸡蛋", ingredients: ["韭菜", "鸡蛋", "盐"] },
        { name: "雪菜毛豆", ingredients: ["毛豆", "雪菜", "猪肉末", "红辣椒"] },
        { name: "锅包肉", ingredients: ["猪里脊", "土豆淀粉", "姜丝", "葱丝", "胡萝卜丝", "糖、醋、生抽(酱汁)"] },
        { name: "孜然羊肉", ingredients: ["羊肉片", "洋葱", "香菜", "孜然粉", "辣椒粉", "芝麻"] },
        { name: "葱爆牛肉", ingredients: ["牛肉", "大葱", "蒜", "姜", "生抽", "老抽", "蚝油"] },
        { name: "小炒黄牛肉", ingredients: ["黄牛肉", "小米椒", "泡椒", "香菜", "芹菜", "姜", "蒜"] },
        { name: "蚂蚁上树", ingredients: ["红薯粉丝", "猪肉末", "郫县豆瓣酱", "姜", "蒜", "葱"] },
        { name: "油焖大虾", ingredients: ["大虾", "葱", "姜", "蒜", "番茄酱", "料酒", "糖", "生抽"] },
        { name: "清蒸鲈鱼", ingredients: ["鲈鱼", "葱", "姜", "蒸鱼豉油", "料酒"] },
        { name: "辣炒花蛤", ingredients: ["花蛤", "干辣椒", "花椒", "姜", "蒜", "葱", "郫县豆瓣酱"] },
        { name: "蒜蓉粉丝蒸扇贝", ingredients: ["扇贝", "龙口粉丝", "大蒜", "小米椒", "蒸鱼豉油"] },
        { name: "凉拌黄瓜", ingredients: ["黄瓜", "蒜", "生抽", "醋", "香油", "辣椒油"] },
        { name: "凉拌海带丝", ingredients: ["干海带丝", "蒜", "辣椒", "醋", "生抽", "糖"] },
        { name: "冬瓜排骨汤", ingredients: ["排骨", "冬瓜", "姜", "葱", "枸杞"] },
        { name: "玉米排骨汤", ingredients: ["排骨", "甜玉米", "胡萝卜", "姜"] },
        { name: "莲藕排骨汤", ingredients: ["排骨", "莲藕", "姜", "葱"] },
        { name: "西红柿鸡蛋汤", ingredients: ["西红柿", "鸡蛋", "葱花", "香油"] },
        { name: "酸辣汤", ingredients: ["豆腐", "黑木耳", "笋", "鸡蛋", "火腿丝", "醋", "胡椒粉"] },
        { name: "西湖牛肉羹", ingredients: ["牛肉末", "鸡蛋清", "香菇", "香菜", "水淀粉"] },
        { name: "东坡肉", ingredients: ["五花肉", "葱", "姜", "冰糖", "绍兴黄酒", "老抽", "生抽"] },
        { name: "麻辣香锅", ingredients: ["任意食材", "午餐肉", "藕片", "西兰花", "虾", "麻辣香锅底料", "干辣椒", "花椒"] },
        { name: "扬州炒饭", ingredients: ["米饭", "鸡蛋", "虾仁", "火腿", "青豆", "玉米", "胡萝卜"] },
        { name: "啤酒鸭", ingredients: ["鸭子", "啤酒", "八角", "桂皮", "香叶", "干辣椒", "姜", "蒜"] }
    ];

    // State
    let selectedDishes = [];
    let isDrawing = false;

    // --- Core Functions ---

    function drawDish() {
        if (isDrawing) return;

        const availableDishes = dishes.filter(dish =>
            !selectedDishes.some(selected => selected.name === dish.name)
        );

        if (availableDishes.length === 0) {
            return;
        }

        isDrawing = true;
        drawButton.disabled = true;

        let finalDish;

        let drawInterval = setInterval(() => {
            finalDish = availableDishes[Math.floor(Math.random() * availableDishes.length)];
            drawButtonText.textContent = `${finalDish.name}`;
        }, 100);

        setTimeout(() => {
            clearInterval(drawInterval);
            selectedDishes.push(finalDish);
            isDrawing = false;
            updateUI();
        }, 1500);
    }

    function removeDish(index) {
        selectedDishes.splice(index, 1);
        updateUI();
    }

    function clearAll() {
        selectedDishes = [];
        updateUI();
    }

    // --- UI Update Functions ---

    function updateUI() {
        updateSelectedDishesList();
        updateShoppingList();
        updateVisibility();
        updateDrawButtonState();
    }

    function updateDrawButtonState() {
        const availableDishes = dishes.filter(dish =>
            !selectedDishes.some(selected => selected.name === dish.name)
        );

        if (isDrawing) return;

        if (availableDishes.length === 0) {
            drawButtonText.textContent = '所有菜品已抽完!';
            drawButton.disabled = true;
        } else {
            drawButton.disabled = false;
            drawButtonText.textContent = selectedDishes.length > 0 ? '再抽一道菜' : '抽一道菜';
        }
    }


    function updateVisibility() {
        if (selectedDishes.length > 0) {
            initialPrompt.classList.add('hidden');
            selectedDishesContainer.classList.remove('hidden');
            shoppingListContainer.classList.remove('hidden');
        } else {
            initialPrompt.classList.remove('hidden');
            selectedDishesContainer.classList.add('hidden');
            shoppingListContainer.classList.add('hidden');
        }
    }

    function updateSelectedDishesList() {
        selectedDishesList.innerHTML = '';
        selectedDishes.forEach((dish, index) => {
            const tag = document.createElement('div');
            tag.className = 'dish-tag';
            tag.innerHTML = `
                <span>${dish.name}</span>
                <button class="remove-dish-btn" data-index="${index}" title="移除这道菜">
                    <i data-lucide="x-circle" class="w-4 h-4 pointer-events-none"></i>
                </button>
            `;
            selectedDishesList.appendChild(tag);
        });
        lucide.createIcons();
    }

    function updateShoppingList() {
        const ingredientMap = new Map();

        selectedDishes.forEach(dish => {
            dish.ingredients.forEach(ingredient => {
                if (!ingredientMap.has(ingredient)) {
                    ingredientMap.set(ingredient, []);
                }
                ingredientMap.get(ingredient).push(dish.name);
            });
        });

        const sortedIngredients = Array.from(ingredientMap.keys()).sort((a, b) => a.localeCompare(b, 'zh-Hans'));

        shoppingList.innerHTML = '';

        if (sortedIngredients.length === 0) {
            return;
        }

        sortedIngredients.forEach(ingredient => {
            const dishesForIngredient = ingredientMap.get(ingredient);
            const li = document.createElement('li');
            li.className = 'flex justify-between items-start py-2 border-b border-gray-200 last:border-b-0';

            li.innerHTML = `
                <span class="font-medium text-gray-800 mr-4">${ingredient}</span>
                <span class="text-sm text-gray-500 text-right">用于: ${dishesForIngredient.join(', ')}</span>
            `;

            shoppingList.appendChild(li);
        });
    }

    // --- Image Generation and Download ---

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
    }

    function showImageInModal(canvas) {
        imagePreviewContainer.innerHTML = ''; // Clear previous image
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.className = 'w-full h-auto rounded-md shadow-inner';
        imagePreviewContainer.appendChild(img);

        imagePreviewModal.classList.remove('hidden');
        setTimeout(() => {
            imagePreviewModal.classList.add('opacity-100');
            modalContent.classList.add('scale-100', 'opacity-100');
            modalContent.classList.remove('scale-95', 'opacity-0');
        }, 10);
    }

    function hideImageModal() {
        imagePreviewModal.classList.remove('opacity-100');
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            imagePreviewModal.classList.add('hidden');
        }, 300);
    }


    function generateImage() {
        if (selectedDishes.length === 0) return;

        const today = new Date();
        const dateString = formatDate(today);
        shoppingListDate.textContent = dateString;

        html2canvas(shoppingListRenderArea, {
            scale: 2,
            backgroundColor: '#f9fafb',
            useCORS: true
        }).then(canvas => {
            const filename = `食材清单-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.png`;

            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            // For touch devices (phones/tablets), display in a modal for the user to long-press and save.
            if (isTouchDevice) {
                showImageInModal(canvas);
            } else {
                // For non-touch devices (desktops), trigger a direct download.
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        }).finally(() => {
            // Clean up the date from the UI after image is generated
            shoppingListDate.textContent = '';
        });
    }

    // --- Event Listeners ---
    drawButton.addEventListener('click', drawDish);
    clearButton.addEventListener('click', clearAll);

    selectedDishesList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-dish-btn');
        if (removeBtn) {
            const index = removeBtn.dataset.index;
            removeDish(parseInt(index, 10));
        }
    });

    generateImageBtn.addEventListener('click', generateImage);

    // Modal close events
    closeModalBtn.addEventListener('click', hideImageModal);
    imagePreviewModal.addEventListener('click', (e) => {
        if (e.target === imagePreviewModal) {
            hideImageModal();
        }
    });


    // Initial State
    updateUI();
});

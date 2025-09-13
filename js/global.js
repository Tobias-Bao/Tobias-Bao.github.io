/**
 * 添加涟漪效果到所有按钮
 */
function addRippleEffect() {
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.addEventListener("click", function (e) {
      // 获取鼠标点击位置
      const x = e.clientX - e.target.getBoundingClientRect().left;
      const y = e.clientY - e.target.getBoundingClientRect().top;

      // 创建涟漪元素
      const ripple = document.createElement("span");
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.className = "ripple-effect";
      this.appendChild(ripple);

      // 动画结束后移除涟漪元素
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
}

/**
 * 初始化页面，添加动画效果
 */
function initPage() {

  // 给页面元素添加入场动画
  document.querySelectorAll(".container > *").forEach((element, index) => {
    if (element.style.animation) return;
    element.style.opacity = "0";
    element.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s forwards`;
  });
}

// 页面加载完成后执行初始化
document.addEventListener("DOMContentLoaded", initPage);

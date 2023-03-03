const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", async(e) => {
    e.preventDefault();
    let form = e.currentTarget;
    let url = form.action;

    try {
        let formData = new FormData(form);
        let responseData = await postFormFieldsAsJson({ url, formData });

        if (responseData.status == 200) {
            //save token in local storage
            let data = await responseData.json();
            localStorage.setItem("token", data.token);

            window.location.href = "/front-end/chat.html";
        }
    } catch (error) {
        console.error(error);
    }
});

async function postFormFieldsAsJson({ url, formData }) {
    let formDataObject = Object.fromEntries(formData.entries());
    let formDataJsonString = JSON.stringify(formDataObject);

    let fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: formDataJsonString,
    };
    let res = await fetch(url, fetchOptions);

    if (!res.ok) {
        let error = await res.text();
        throw new Error(error);
    }

    return res;
}
const createImg = async (image) => {
    const newImage = new Image()

    return new Promise((resolve) => {
        newImage.onload = () => resolve(newImage)
        newImage.src = image
    });
};

export const loadImages = async (images: object) => {
    const loadImgPromises = Object.keys(images).map(async (arrKey) => {
        const img = await createImg(images[arrKey])
        return { [arrKey]: img }
    })

    const resolvedImage = await Promise.all(loadImgPromises);
    const loadedImages = resolvedImage.reduce((accumulator, current) => {
        return {...accumulator, ...current}
    }, {});

    return loadedImages;
};



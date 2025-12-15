const importAllImages = (context) => {
  const images = {};
  context.keys().forEach((key) => {
    const imageName = key.replace('./', '').replace(/\.(png|jpe?g|svg)$/, '');
    images[imageName] = context(key).default;
  });
  return images;
};


const assets = importAllImages(
  import.meta.glob('./images/**/*.{png,jpg,jpeg,svg}', { eager: true })
);

export { assets };
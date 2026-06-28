import type { CSSProperties, ImgHTMLAttributes } from "react";

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
};

const Image = ({
  fill,
  style,
  sizes: _sizes,
  priority: _priority,
  ...props
}: ImageProps) => {
  const imageStyle: CSSProperties = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...style,
      }
    : { ...style };

  return <img {...props} style={imageStyle} />;
};

export default Image;

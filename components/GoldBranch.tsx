import Image from "next/image";

type Props = {
  className?: string;
  rotate?: boolean;
};

export default function GoldBranch({
  className = "",
  rotate = false,
}: Props) {

  return (

    <Image
      src="/images/gold-branch.png"
      alt="gold branch"
      width={450}
      height={450}
      style={{
        width: "auto",
        height: "auto",
      }}
      className={`
        pointer-events-none
        absolute
        ${rotate ? "rotate-180" : ""}
        ${className}
      `}
    />

  );

}
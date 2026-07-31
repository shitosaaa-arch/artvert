import Image from "next/image";



interface GoldBranchProps {

  className?: string;

  rotate?: boolean;

}





export default function GoldBranch({

  className = "",

  rotate = false,

}: GoldBranchProps) {



  return (


    <div

      className={`
      absolute
      pointer-events-none
      ${rotate ? "rotate-180" : ""}
      ${className}
      `}

    >



      <Image

        src="/images/gold-branch.png"

        alt=""

        width={500}

        height={500}

        loading="lazy"

        className="
        h-auto
        w-[350px]
        object-contain
        "

      />



    </div>


  );

}
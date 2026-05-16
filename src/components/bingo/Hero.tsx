import DashboardHeader from "@/components/layout/DashboardHeader";

type Props = {
  title?: string;
};

export default function BingoHero({ title = "Bingo" }: Props) {
  return <DashboardHeader title={title} />;
}

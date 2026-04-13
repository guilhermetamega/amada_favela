import DashboardHeader from "@/components/layout/DashboardHeader";

type Props = {
  title?: string;
};

export default function PollsHero({ title = "Enquetes" }: Props) {
  return <DashboardHeader title={title} />;
}

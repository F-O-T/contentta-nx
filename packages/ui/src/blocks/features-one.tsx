import { Card } from "../components/card";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "../components/table";

export interface TableRowType {
   id: string;
   date: string;
   status: string;
   statusColor: "green" | "orange" | "red";
   customer: string;
   revenue: string;
}

export interface Feature {
   title: string;
   description: string;
}

export interface Testimonial {
   quote: string;
   author: string;
   role: string;
}

export interface FeaturesOneContent {
   title: string;
   description: string;
   tableRows: TableRowType[];
   features: Feature[];
   testimonial: Testimonial;
}

const statusColorMap = {
   green: "bg-green-100 text-green-800",
   orange: "bg-orange-100 text-orange-800",
   red: "bg-red-100 text-red-800",
};

const defaultContent: FeaturesOneContent = {
   description:
      "Automate your tasks and workflows by connecting your favorite tools like Notion, Todoist, and more. AI-powered scheduling helps you stay on track and adapt to changing priorities.",
   features: [
      {
         description:
            "Effortlessly plan and execute your marketing campaigns organized.",
         title: "Marketing Campaigns",
      },
      {
         description:
            "Effortlessly book and manage your meetings. Stay on top of your schedule.",
         title: "AI Meeting Scheduler",
      },
   ],
   tableRows: [
      {
         customer: "Bernard Ng",
         date: "10/31/2023",
         id: "1",
         revenue: "$43.99",
         status: "Paid",
         statusColor: "green",
      },
      {
         customer: "Méschac Irung",
         date: "10/21/2023",
         id: "2",
         revenue: "$19.99",
         status: "Ref",
         statusColor: "orange",
      },
      {
         customer: "Glodie Ng",
         date: "10/15/2023",
         id: "3",
         revenue: "$99.99",
         status: "Paid",
         statusColor: "green",
      },
      {
         customer: "Theo Ng",
         date: "10/12/2023",
         id: "4",
         revenue: "$19.99",
         status: "Cancelled",
         statusColor: "red",
      },
   ],
   testimonial: {
      author: "Méschac Irung",
      quote: "Wow, auto-generated pages are the kind of thing that you don't even know you need until you see it. It's like an AI-native CRM.",
      role: "Creator",
   },
   title: "Effortless Task Management",
};

export function FeaturesOne() {
   const mergedContent = { ...defaultContent };

   return (
      <section>
         <div className="bg-muted/50 py-24">
            <div className="mx-auto w-full max-w-5xl px-6">
               <div>
                  <h2 className="text-foreground text-4xl font-semibold">
                     {mergedContent.title}
                  </h2>
                  <p className="text-muted-foreground mb-12 mt-4 text-balance text-lg">
                     {mergedContent.description}
                  </p>
                  <div className="bg-foreground/5 rounded-3xl p-6">
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Revenue</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {mergedContent.tableRows.map((row) => (
                              <TableRow key={row.id}>
                                 <TableCell>{row.id}</TableCell>
                                 <TableCell>{row.date}</TableCell>
                                 <TableCell>
                                    <span
                                       className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                          statusColorMap[row.statusColor]
                                       }`}
                                    >
                                       {row.status}
                                    </span>
                                 </TableCell>
                                 <TableCell>{row.customer}</TableCell>
                                 <TableCell>{row.revenue}</TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </div>
               </div>

               <div className="border-foreground/10 relative mt-16 grid gap-12 border-b pb-12 [--radius:1rem] md:grid-cols-2">
                  {mergedContent.features.map((feature, index) => (
                     <div key={index}>
                        <h3 className="text-foreground text-xl font-semibold">
                           {feature.title}
                        </h3>
                        <p className="text-muted-foreground my-4 text-lg">
                           {feature.description}
                        </p>
                        <Card className="aspect-video overflow-hidden px-6">
                           <Card className="h-full translate-y-6" />
                        </Card>
                     </div>
                  ))}
               </div>

               <blockquote className="before:bg-primary relative mt-12 max-w-xl pl-6 before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full">
                  <p className="text-foreground text-lg">
                     {mergedContent.testimonial.quote}
                  </p>
                  <footer className="mt-4 flex items-center gap-2">
                     <cite>{mergedContent.testimonial.author}</cite>
                     <span
                        aria-hidden
                        className="bg-foreground/15 size-1 rounded-full"
                     ></span>
                     <span className="text-muted-foreground">
                        {mergedContent.testimonial.role}
                     </span>
                  </footer>
               </blockquote>
            </div>
         </div>
      </section>
   );
}
